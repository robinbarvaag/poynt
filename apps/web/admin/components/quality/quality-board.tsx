"use client";

import type { QualityArea, QualityOverviewRow } from "@/lib/quality-overview";
import { Button } from "@payloadcms/ui";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Kvalitetsoversikten (admin-view /admin/kvalitet): alle sider, blogginnlegg,
 * guider, kundehistorier, tjenester og produkter med AI-kvalitetsscore, når de
 * sist ble vurdert, og om innholdet er endret siden (hash-sammenligning —
 * samme logikk som stripa inne på hvert dokument).
 *
 * To fanenivåer: status («Trenger vurdering» / «Vurdert og oppdatert») og
 * område (nettsiden vs. On Poynt-medlemsområdet).
 *
 * «Vurder alle som trenger det» kjører KUN dokumentene som mangler vurdering
 * eller er endret siden sist — aldri de som allerede er ferske. Kjøres én og
 * én (hver vurdering er et AI-kall på 20–60 s); ruta lagrer resultatet på
 * dokumentet server-side (persist: true), så ingenting må åpnes og lagres.
 * Fremdriftslinja viser brukt tid og et anslag basert på snittet av
 * vurderingene som allerede er ferdige i denne runden.
 */

type RunState = "idle" | "running" | "done" | "error";

interface RowState extends QualityOverviewRow {
  runState: RunState;
  runError?: string;
  /** epoch ms da denne raden startet å kjøre (for «Vurderer … 23 s»). */
  startedAt?: number;
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

const AREA_LABELS: Record<QualityArea, string> = {
  site: "Nettsiden",
  "on-poynt": "On Poynt",
};

// Startanslag per vurdering før vi har målt noe selv denne runden.
const DEFAULT_SECONDS_PER_REVIEW = 40;

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

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60);
  const rest = s % 60;
  return rest ? `${min} min ${rest} s` : `${min} min`;
}

const rowKey = (r: { collection: string; id: string | number }) =>
  `${r.collection}:${r.id}`;

const tabStyle = (active: boolean): CSSProperties => ({
  appearance: "none",
  background: "none",
  border: "none",
  borderBottom: active
    ? "2px solid var(--theme-text)"
    : "2px solid transparent",
  padding: "0.5rem 0.25rem",
  marginBottom: -1,
  cursor: "pointer",
  fontSize: "0.9rem",
  fontWeight: active ? 600 : 400,
  color: active ? "var(--theme-text)" : "var(--theme-elevation-600)",
});

export const QualityBoard = ({
  rows: initial,
}: { rows: QualityOverviewRow[] }) => {
  const [rows, setRows] = useState<RowState[]>(
    initial.map((r) => ({ ...r, runState: "idle" }))
  );
  const [statusTab, setStatusTab] = useState<"needs" | "reviewed">("needs");
  const [areaFilter, setAreaFilter] = useState<"all" | QualityArea>("all");
  const [batchRunning, setBatchRunning] = useState(false);
  const [batch, setBatch] = useState<{
    done: number;
    total: number;
    currentTitle: string | null;
    startedAt: number;
    finishedMessage: string | null;
  } | null>(null);
  // Varighet (sekunder) per fullført vurdering i denne økta — grunnlag for
  // anslaget på gjenstående tid.
  const durationsRef = useRef<number[]>([]);
  // Tikker hvert sekund mens noe kjører, så tidtellerne oppdaterer seg.
  const [now, setNow] = useState(() => Date.now());

  const anythingRunning =
    batchRunning || rows.some((r) => r.runState === "running");

  useEffect(() => {
    if (!anythingRunning) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [anythingRunning]);

  const areaRows =
    areaFilter === "all" ? rows : rows.filter((r) => r.area === areaFilter);
  const needsRows = areaRows.filter((r) => r.status !== "fresh");
  const reviewedRows = areaRows.filter((r) => r.status === "fresh");
  const visible = statusTab === "needs" ? needsRows : reviewedRows;

  const counts = useMemo(
    () => ({
      unreviewed: areaRows.filter((r) => r.status === "unreviewed").length,
      stale: areaRows.filter((r) => r.status === "stale").length,
    }),
    [areaRows]
  );

  const areaCounts = useMemo(() => {
    const count = (area: "all" | QualityArea) => {
      const list = area === "all" ? rows : rows.filter((r) => r.area === area);
      return list.filter((r) => r.status !== "fresh").length;
    };
    return {
      all: count("all"),
      site: count("site"),
      "on-poynt": count("on-poynt"),
    };
  }, [rows]);

  const patchRow = (key: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r) => (rowKey(r) === key ? { ...r, ...patch } : r))
    );
  };

  const runOne = async (row: RowState): Promise<boolean> => {
    const key = rowKey(row);
    const startedAt = Date.now();
    patchRow(key, { runState: "running", runError: undefined, startedAt });
    try {
      const res = await fetch("/api/ai/quality-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          // Globaler (Forsiden) har ingen id og går via ?global=.
          row.isGlobal
            ? { global: row.collection, persist: true }
            : { collection: row.collection, id: row.id, persist: true }
        ),
      });
      const data = (await res.json()) as {
        totalScore?: number;
        reviewedAt?: string;
        error?: string;
      };
      if (!res.ok || typeof data.totalScore !== "number") {
        throw new Error(data.error || "Kunne ikke vurdere innholdet.");
      }
      durationsRef.current.push((Date.now() - startedAt) / 1000);
      patchRow(key, {
        runState: "done",
        status: "fresh",
        score: data.totalScore,
        reviewedAt: data.reviewedAt ?? new Date().toISOString(),
        startedAt: undefined,
      });
      return true;
    } catch (e) {
      patchRow(key, {
        runState: "error",
        runError: e instanceof Error ? e.message : "Noe gikk galt.",
        startedAt: undefined,
      });
      return false;
    }
  };

  const runAll = async () => {
    setBatchRunning(true);
    durationsRef.current = [];
    // Les lista én gang ved start — radene som blir ferske underveis skal
    // uansett ikke kjøres på nytt. Kjører bare det som er synlig i valgt
    // område, så «Vurder alle» gjør det fanen viser.
    const queue = areaRows.filter((r) => r.status !== "fresh");
    const startedAt = Date.now();
    setBatch({
      done: 0,
      total: queue.length,
      currentTitle: null,
      startedAt,
      finishedMessage: null,
    });
    let done = 0;
    for (const row of queue) {
      setBatch((b) => (b ? { ...b, done, currentTitle: row.title } : b));
      await runOne(row);
      done += 1;
      setBatch((b) => (b ? { ...b, done } : b));
    }
    setBatch((b) =>
      b
        ? {
            ...b,
            currentTitle: null,
            finishedMessage: queue.length
              ? `Ferdig — ${queue.length} ${
                  queue.length === 1 ? "vurdering" : "vurderinger"
                } på ${formatDuration((Date.now() - startedAt) / 1000)}.`
              : null,
          }
        : b
    );
    setBatchRunning(false);
  };

  // Anslag: snittet av fullførte vurderinger denne runden, ellers 40 s.
  const avgSeconds = durationsRef.current.length
    ? durationsRef.current.reduce((a, b) => a + b, 0) /
      durationsRef.current.length
    : DEFAULT_SECONDS_PER_REVIEW;

  const batchElapsed = batch ? (now - batch.startedAt) / 1000 : 0;
  const batchRemaining = batch
    ? Math.max(0, batch.total - batch.done) * avgSeconds
    : 0;

  return (
    <div>
      {/* Områdefilter: nettsiden vs. On Poynt-medlemsområdet. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        {(
          [
            ["all", "Alt innhold"],
            ["site", "Nettsiden"],
            ["on-poynt", "On Poynt"],
          ] as const
        ).map(([value, label]) => {
          const active = areaFilter === value;
          const needs = areaCounts[value];
          return (
            <Button
              key={value}
              buttonStyle={active ? "primary" : "pill"}
              size="small"
              margin={false}
              onClick={() => setAreaFilter(value)}
              disabled={batchRunning}
            >
              {needs > 0 ? `${label} (${needs})` : label}
            </Button>
          );
        })}
        <span
          style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}
        >
          Tallet viser hvor mye som trenger vurdering.
        </span>
      </div>

      {/* Statusfaner: trenger vurdering vs. vurdert og oppdatert. */}
      <div
        style={{
          display: "flex",
          gap: "1.25rem",
          borderBottom: "1px solid var(--theme-elevation-150)",
          marginBottom: "1rem",
        }}
      >
        <button
          type="button"
          style={tabStyle(statusTab === "needs")}
          onClick={() => setStatusTab("needs")}
        >
          Trenger vurdering ({needsRows.length})
        </button>
        <button
          type="button"
          style={tabStyle(statusTab === "reviewed")}
          onClick={() => setStatusTab("reviewed")}
        >
          Vurdert og oppdatert ({reviewedRows.length})
        </button>
      </div>

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
          disabled={batchRunning || needsRows.length === 0}
        >
          {batchRunning
            ? "Vurderer …"
            : needsRows.length === 0
              ? "Alt er vurdert og oppdatert"
              : `Vurder alle som trenger det (${needsRows.length})`}
        </Button>
        <span
          style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}
        >
          {counts.unreviewed} ikke vurdert · {counts.stale} endret siden sist ·
          hver vurdering tar vanligvis 20–60 sekunder
        </span>
      </div>

      {batch && (batchRunning || batch.finishedMessage) && (
        <div
          style={{
            margin: "0 0 1rem",
            padding: "0.75rem 1rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "0.5rem",
            background: "var(--theme-elevation-50)",
          }}
          aria-live="polite"
        >
          {batchRunning ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  fontSize: "0.85rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span>
                  Vurderer {Math.min(batch.done + 1, batch.total)} av{" "}
                  {batch.total}
                  {batch.currentTitle ? `: «${batch.currentTitle}»` : ""} …
                </span>
                <span style={{ color: "var(--theme-elevation-600)" }}>
                  Brukt {formatDuration(batchElapsed)} · anslått ca.{" "}
                  {formatDuration(batchRemaining)} igjen
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "var(--theme-elevation-150)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${
                      batch.total
                        ? Math.round((batch.done / batch.total) * 100)
                        : 0
                    }%`,
                    background: "var(--theme-success-500, #22c55e)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <p
                style={{
                  margin: "0.5rem 0 0",
                  fontSize: "0.78rem",
                  color: "var(--theme-elevation-500)",
                }}
              >
                La fanen stå åpen — vurderingene kjører én og én, og resultatet
                lagres automatisk på hvert dokument.
              </p>
            </>
          ) : (
            <span style={{ fontSize: "0.85rem" }}>{batch.finishedMessage}</span>
          )}
        </div>
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
              const rowElapsed =
                row.runState === "running" && row.startedAt
                  ? (now - row.startedAt) / 1000
                  : null;
              return (
                <tr key={rowKey(row)}>
                  <td
                    style={{
                      padding: "0.55rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                    }}
                  >
                    <Link
                      href={
                        row.isGlobal
                          ? `/admin/globals/${row.collection}`
                          : `/admin/collections/${row.collection}/${row.id}`
                      }
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
                    {areaFilter === "all" && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          color: "var(--theme-elevation-400)",
                        }}
                      >
                        {AREA_LABELS[row.area]}
                      </span>
                    )}
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
                          background:
                            row.runState === "running"
                              ? "var(--theme-warning-500, #eab308)"
                              : meta.color,
                          flexShrink: 0,
                        }}
                      />
                      {row.runState === "running"
                        ? `Vurderer … ${
                            rowElapsed !== null
                              ? formatDuration(rowElapsed)
                              : ""
                          }`
                        : meta.label}
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
                  {statusTab === "needs"
                    ? "Ingenting trenger vurdering akkurat nå — alt innhold her er vurdert og uendret siden sist."
                    : "Ingenting er vurdert her ennå."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
