"use client";

import type { QualityOverviewRow } from "@/lib/quality-overview";
import { Button } from "@payloadcms/ui";
import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Kvalitetsoversikten (admin-view /admin/kvalitet): alle sider, blogginnlegg,
 * guider, kundehistorier, tjenester og produkter med AI-kvalitetsscore, når de
 * sist ble vurdert, og om innholdet er endret siden (hash-sammenligning —
 * samme logikk som stripa inne på hvert dokument).
 *
 * «Vurder alle som trenger det» kjører KUN dokumentene som mangler vurdering
 * eller er endret siden sist — aldri de som allerede er ferske. Kjøres én og
 * én (hver vurdering er et AI-kall på 20–60 s); ruta lagrer resultatet på
 * dokumentet server-side (persist: true), så ingenting må åpnes og lagres.
 */

type RunState = "idle" | "running" | "done" | "error";

interface RowState extends QualityOverviewRow {
  runState: RunState;
  runError?: string;
}

const STATUS_META: Record<
  QualityOverviewRow["status"],
  { label: string; color: string }
> = {
  unreviewed: { label: "Ikke vurdert", color: "var(--theme-elevation-400)" },
  stale: {
    label: "Endret siden sist",
    color: "var(--theme-warning-500, #eab308)",
  },
  fresh: { label: "Oppdatert", color: "var(--theme-success-500, #22c55e)" },
};

function scoreColor(score: number): string {
  if (score >= 70) return "var(--theme-success-500, #22c55e)";
  if (score >= 40) return "var(--theme-warning-500, #eab308)";
  return "var(--theme-error-500, #ef4444)";
}

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "–";
  return d.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const rowKey = (r: { collection: string; id: string | number }) =>
  `${r.collection}:${r.id}`;

export const QualityBoard = ({
  rows: initial,
}: { rows: QualityOverviewRow[] }) => {
  const [rows, setRows] = useState<RowState[]>(
    initial.map((r) => ({ ...r, runState: "idle" }))
  );
  const [filter, setFilter] = useState<"needs" | "all">("needs");
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      unreviewed: rows.filter((r) => r.status === "unreviewed").length,
      stale: rows.filter((r) => r.status === "stale").length,
      fresh: rows.filter((r) => r.status === "fresh").length,
    }),
    [rows]
  );
  const needsReview = rows.filter((r) => r.status !== "fresh");
  const visible = filter === "needs" ? needsReview : rows;

  const patchRow = (key: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r) => (rowKey(r) === key ? { ...r, ...patch } : r))
    );
  };

  const runOne = async (row: RowState): Promise<boolean> => {
    const key = rowKey(row);
    patchRow(key, { runState: "running", runError: undefined });
    try {
      const res = await fetch("/api/ai/quality-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection: row.collection,
          id: row.id,
          persist: true,
        }),
      });
      const data = (await res.json()) as {
        totalScore?: number;
        reviewedAt?: string;
        error?: string;
      };
      if (!res.ok || typeof data.totalScore !== "number") {
        throw new Error(data.error || "Kunne ikke vurdere innholdet.");
      }
      patchRow(key, {
        runState: "done",
        status: "fresh",
        score: data.totalScore,
        reviewedAt: data.reviewedAt ?? new Date().toISOString(),
      });
      return true;
    } catch (e) {
      patchRow(key, {
        runState: "error",
        runError: e instanceof Error ? e.message : "Noe gikk galt.",
      });
      return false;
    }
  };

  const runAll = async () => {
    setBatchRunning(true);
    // Les lista én gang ved start — radene som blir ferske underveis skal
    // uansett ikke kjøres på nytt.
    const queue = rows.filter((r) => r.status !== "fresh");
    let done = 0;
    for (const row of queue) {
      done += 1;
      setBatchProgress(`Vurderer ${done} av ${queue.length}: «${row.title}» …`);
      await runOne(row);
    }
    setBatchProgress(
      queue.length
        ? `Ferdig — ${queue.length} ${queue.length === 1 ? "vurdering" : "vurderinger"} kjørt.`
        : null
    );
    setBatchRunning(false);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <Button
          buttonStyle="pill"
          size="small"
          margin={false}
          onClick={runAll}
          disabled={batchRunning || needsReview.length === 0}
        >
          {batchRunning
            ? "Vurderer …"
            : needsReview.length === 0
              ? "Alt er vurdert og oppdatert"
              : `Vurder alle som trenger det (${needsReview.length})`}
        </Button>
        <Button
          buttonStyle="pill"
          size="small"
          margin={false}
          onClick={() => setFilter(filter === "needs" ? "all" : "needs")}
          disabled={batchRunning}
        >
          {filter === "needs"
            ? `Vis alle (${rows.length})`
            : "Vis bare de som trenger vurdering"}
        </Button>
        <span
          style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}
        >
          {counts.unreviewed} ikke vurdert · {counts.stale} endret siden sist ·{" "}
          {counts.fresh} oppdatert
        </span>
      </div>

      {batchProgress && (
        <p
          style={{
            margin: "0 0 0.75rem",
            fontSize: "0.82rem",
            color: "var(--theme-elevation-600)",
          }}
          aria-live="polite"
        >
          {batchProgress}
        </p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Tittel", "Type", "Status", "Score", "Sist vurdert", ""].map(
                (h) => (
                  <th
                    key={h || "actions"}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--theme-elevation-500)",
                      borderBottom: "1px solid var(--theme-elevation-150)",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const meta = STATUS_META[row.status];
              return (
                <tr key={rowKey(row)}>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    <Link
                      href={`/admin/collections/${row.collection}/${row.id}`}
                      prefetch={false}
                      style={{ textDecoration: "none" }}
                    >
                      {row.title}
                    </Link>
                    {row.isDraft && (
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          fontSize: "0.72rem",
                          color: "var(--theme-elevation-500)",
                        }}
                      >
                        utkast
                      </span>
                    )}
                    {row.runState === "error" && row.runError && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "var(--theme-error-500)",
                        }}
                      >
                        {row.runError}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      fontSize: "0.82rem",
                      color: "var(--theme-elevation-600)",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    {row.collectionLabel}
                  </td>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: meta.color,
                          flexShrink: 0,
                        }}
                      />
                      {row.runState === "running" ? "Vurderer …" : meta.label}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    {row.score !== null ? (
                      <strong style={{ color: scoreColor(row.score) }}>
                        {row.score}
                      </strong>
                    ) : (
                      <span style={{ color: "var(--theme-elevation-400)" }}>
                        –
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      fontSize: "0.82rem",
                      color: "var(--theme-elevation-600)",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    {formatDate(row.reviewedAt)}
                  </td>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      textAlign: "right",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    <Button
                      buttonStyle="pill"
                      size="small"
                      margin={false}
                      onClick={() => runOne(row)}
                      disabled={batchRunning || row.runState === "running"}
                    >
                      {row.runState === "running"
                        ? "Vurderer …"
                        : row.status === "fresh"
                          ? "Vurder på nytt"
                          : "Vurder"}
                    </Button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "1rem 0.75rem",
                    color: "var(--theme-elevation-500)",
                    fontSize: "0.85rem",
                  }}
                >
                  {filter === "needs"
                    ? "Ingenting trenger vurdering akkurat nå — alt innhold er vurdert og uendret siden sist."
                    : "Fant ikke noe innhold."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
