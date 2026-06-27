"use client";

import {
  type ContentSuggestionTypeValue,
  contentSuggestionTypeLabels,
} from "@poynt/planner-validators";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { runRadarNow, setSuggestionStatus } from "../../actions/radar";
import type { RadarRunItem, RadarSuggestionItem } from "../../views/radar/list";

const kindLabels: Record<string, string> = {
  stale: "Foreldet",
  stuck_draft: "Fastlåst utkast",
  coverage_gap: "Kategori-gap",
  featured_rotation: "Fremhevet-rotasjon",
  demand: "Etterspørsel",
};

const typeColors: Record<ContentSuggestionTypeValue, string> = {
  create: "var(--theme-success-600)",
  refresh: "var(--theme-warning-600)",
  promote: "var(--theme-elevation-600)",
  repurpose: "var(--theme-elevation-600)",
};

function priorityColor(p: number): { bg: string; fg: string } {
  if (p >= 80)
    return { bg: "var(--theme-error-100)", fg: "var(--theme-error-700)" };
  if (p >= 60)
    return { bg: "var(--theme-warning-100)", fg: "var(--theme-warning-700)" };
  return { bg: "var(--theme-elevation-100)", fg: "var(--theme-elevation-600)" };
}

type StatusFilter =
  | "aktive"
  | "new"
  | "snoozed"
  | "done"
  | "dismissed"
  | "alle";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "aktive", label: "Aktive" },
  { value: "new", label: "Nye" },
  { value: "snoozed", label: "Snoozet" },
  { value: "done", label: "Ferdige" },
  { value: "dismissed", label: "Avviste" },
  { value: "alle", label: "Alle" },
];

function fmtDate(d: unknown): string {
  if (!d) return "—";
  const date = new Date(d as string);
  return date.toLocaleString("nb-NO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const RadarBoard = ({
  suggestions,
  runs,
}: {
  suggestions: RadarSuggestionItem[];
  runs: RadarRunItem[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktive");
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "alle") return suggestions;
    if (statusFilter === "aktive")
      return suggestions.filter(
        (s) => s.status === "new" || s.status === "snoozed"
      );
    return suggestions.filter((s) => s.status === statusFilter);
  }, [suggestions, statusFilter]);

  const counts = useMemo(() => {
    const c = { new: 0, snoozed: 0, done: 0, dismissed: 0 };
    for (const s of suggestions) {
      if (s.status in c) c[s.status as keyof typeof c] += 1;
    }
    return c;
  }, [suggestions]);

  async function handleStatus(
    id: string,
    status: "new" | "snoozed" | "done" | "dismissed"
  ) {
    setLoading(id);
    try {
      await setSuggestionStatus(id, status);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleRun() {
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await runRadarNow();
      setRunMsg(
        res.success
          ? "Radaren kjører i bakgrunnen. Oppdater om et lite øyeblikk for å se nye forslag."
          : `Kunne ikke starte: ${res.error ?? "ukjent feil"}`
      );
    } finally {
      setRunning(false);
    }
  }

  const lastRun = runs[0];

  const btn = (
    variant: "primary" | "ghost" | "danger" | "success"
  ): React.CSSProperties => ({
    padding: "0.25rem 0.75rem",
    border: "none",
    borderRadius: "var(--style-radius-s)",
    fontSize: "var(--font-body-size)",
    cursor: "pointer",
    background:
      variant === "primary"
        ? "var(--theme-success-600)"
        : variant === "success"
          ? "var(--theme-success-500)"
          : variant === "danger"
            ? "var(--theme-error-600)"
            : "var(--theme-elevation-100)",
    color: variant === "ghost" ? "var(--theme-text)" : "white",
  });

  const pill = (bg: string, fg: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "0.15rem 0.55rem",
    borderRadius: "var(--style-radius-s)",
    fontSize: "0.78em",
    fontWeight: 600,
    background: bg,
    color: fg,
    whiteSpace: "nowrap",
  });

  return (
    <div>
      {/* Behind the scenes: kjør-panel + siste kjøring */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-m)",
          background: "var(--theme-elevation-50)",
        }}
      >
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
        >
          <strong style={{ fontSize: "0.9em" }}>
            Slik kjørte radaren sist
          </strong>
          {lastRun ? (
            <span
              style={{
                fontSize: "0.85em",
                color: "var(--theme-elevation-600)",
              }}
            >
              {fmtDate(lastRun.startedAt)} · {triggerLabel(lastRun.trigger)} ·{" "}
              <RunStats stats={lastRun.stats} status={lastRun.status} />
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.85em",
                color: "var(--theme-elevation-500)",
              }}
            >
              Radaren har ikke kjørt ennå.
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {runMsg && (
            <span
              style={{
                fontSize: "0.82em",
                color: "var(--theme-elevation-600)",
              }}
            >
              {runMsg}
            </span>
          )}
          <button
            type="button"
            style={btn("primary")}
            onClick={handleRun}
            disabled={running}
          >
            {running ? "Starter…" : "Kjør radaren nå"}
          </button>
          <button
            type="button"
            style={btn("ghost")}
            onClick={() => router.refresh()}
          >
            Oppdater
          </button>
        </div>
      </div>

      {/* Filtre */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          marginBottom: "1.25rem",
        }}
      >
        {statusFilters.map((f) => {
          const active = statusFilter === f.value;
          const extra =
            f.value === "new"
              ? counts.new
              : f.value === "snoozed"
                ? counts.snoozed
                : f.value === "done"
                  ? counts.done
                  : f.value === "dismissed"
                    ? counts.dismissed
                    : null;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "var(--style-radius-s)",
                border: "1px solid var(--theme-elevation-150)",
                cursor: "pointer",
                fontSize: "0.85em",
                fontWeight: active ? 600 : 400,
                background: active
                  ? "var(--theme-text)"
                  : "var(--theme-elevation-50)",
                color: active ? "var(--theme-bg)" : "var(--theme-text)",
              }}
            >
              {f.label}
              {extra !== null ? ` (${extra})` : ""}
            </button>
          );
        })}
      </div>

      {/* Forslag */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--theme-elevation-500)", padding: "2rem 0" }}>
          Ingen forslag her ennå. Kjør radaren for å generere forslag.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}
        >
          {filtered.map((s) => {
            const pc = priorityColor(s.priority);
            const evidence = s.evidence as {
              kind?: string;
              summary?: string;
            } | null;
            const isActive = s.status === "new" || s.status === "snoozed";
            const targetHref =
              s.targetCollection && s.targetId
                ? `/admin/collections/${s.targetCollection}/${s.targetId}`
                : null;
            return (
              <div
                key={s.id}
                style={{
                  padding: "1rem 1.25rem",
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "var(--style-radius-m)",
                  background: "var(--theme-bg)",
                  opacity: s.status === "dismissed" ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={pill(pc.bg, pc.fg)}>Prioritet {s.priority}</span>
                  <span
                    style={pill(
                      "var(--theme-elevation-100)",
                      typeColors[s.type as ContentSuggestionTypeValue] ??
                        "var(--theme-elevation-600)"
                    )}
                  >
                    {contentSuggestionTypeLabels[
                      s.type as ContentSuggestionTypeValue
                    ] ?? s.type}
                  </span>
                  {evidence?.kind && (
                    <span
                      style={pill(
                        "var(--theme-elevation-50)",
                        "var(--theme-elevation-500)"
                      )}
                    >
                      {kindLabels[evidence.kind] ?? evidence.kind}
                    </span>
                  )}
                  {s.status !== "new" && (
                    <span
                      style={pill(
                        "var(--theme-elevation-50)",
                        "var(--theme-elevation-500)"
                      )}
                    >
                      {statusLabel(s.status)}
                    </span>
                  )}
                </div>

                <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: "0.9em",
                    color: "var(--theme-elevation-700)",
                    marginBottom: evidence?.summary ? "0.5rem" : 0,
                  }}
                >
                  {s.rationale}
                </div>

                {evidence?.summary && (
                  <div
                    style={{
                      fontSize: "0.82em",
                      color: "var(--theme-elevation-500)",
                      borderLeft: "2px solid var(--theme-elevation-200)",
                      paddingLeft: "0.6rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <strong>Hvorfor:</strong> {evidence.summary}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginTop: "0.5rem",
                  }}
                >
                  {targetHref && (
                    <a
                      href={targetHref}
                      style={{ ...btn("ghost"), textDecoration: "none" }}
                    >
                      Åpne innholdet
                    </a>
                  )}
                  {isActive ? (
                    <>
                      <button
                        type="button"
                        style={btn("success")}
                        onClick={() => handleStatus(s.id, "done")}
                        disabled={loading === s.id}
                      >
                        Ferdig
                      </button>
                      {s.status !== "snoozed" && (
                        <button
                          type="button"
                          style={btn("ghost")}
                          onClick={() => handleStatus(s.id, "snoozed")}
                          disabled={loading === s.id}
                        >
                          Snooze
                        </button>
                      )}
                      <button
                        type="button"
                        style={btn("danger")}
                        onClick={() => handleStatus(s.id, "dismissed")}
                        disabled={loading === s.id}
                      >
                        Avvis
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={btn("ghost")}
                      onClick={() => handleStatus(s.id, "new")}
                      disabled={loading === s.id}
                    >
                      Gjenåpne
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function triggerLabel(t: string): string {
  if (t === "manual") return "manuell";
  if (t === "scheduled") return "ukentlig";
  if (t === "heartbeat") return "hjerteslag";
  return t;
}

function statusLabel(s: string): string {
  if (s === "snoozed") return "Snoozet";
  if (s === "done") return "Ferdig";
  if (s === "dismissed") return "Avvist";
  return "Ny";
}

function RunStats({
  stats,
  status,
}: {
  stats: unknown;
  status: string;
}) {
  if (status === "running") return <>kjører…</>;
  if (status === "error") return <span>feilet</span>;
  const s = stats as {
    signals?: number;
    total?: number;
    created?: number;
    updated?: number;
    skipped?: number;
  } | null;
  if (!s) return <>fullført</>;
  if (typeof s.signals === "number" && typeof s.total === "number") {
    return (
      <>
        {s.signals} signaler → {s.total} forslag → {s.created ?? 0} nye,{" "}
        {s.updated ?? 0} oppdatert
      </>
    );
  }
  return <>{s.signals ?? 0} signaler</>;
}
