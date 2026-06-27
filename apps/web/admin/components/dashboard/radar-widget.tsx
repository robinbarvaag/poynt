import { db, desc, eq, or } from "@poynt/planner-db";
import {
  plannerContentSuggestion,
  plannerRadarRun,
} from "@poynt/planner-db/schema";

/**
 * «Bindersen» — innholdsradar-widget på admin-dashboardet (beforeDashboard).
 * Viser de mest presserende forslagene + en kort «behind the scenes» av siste
 * kjøring, med lenke til full oversikt. Se docs/CONTENT-RADAR.md.
 */
export const RadarWidget = async () => {
  const [top, lastRun] = await Promise.all([
    db
      .select({
        id: plannerContentSuggestion.id,
        title: plannerContentSuggestion.title,
        type: plannerContentSuggestion.type,
        priority: plannerContentSuggestion.priority,
      })
      .from(plannerContentSuggestion)
      .where(
        or(
          eq(plannerContentSuggestion.status, "new"),
          eq(plannerContentSuggestion.status, "snoozed")
        )
      )
      .orderBy(desc(plannerContentSuggestion.priority))
      .limit(4),
    db
      .select({
        startedAt: plannerRadarRun.startedAt,
        stats: plannerRadarRun.stats,
      })
      .from(plannerRadarRun)
      .where(eq(plannerRadarRun.status, "ok"))
      .orderBy(desc(plannerRadarRun.startedAt))
      .limit(1),
  ]);

  const run = lastRun[0];
  const stats = run?.stats as { signals?: number; total?: number } | null;

  return (
    <div
      style={{
        padding: "1.25rem 1.5rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m)",
        background: "var(--theme-elevation-50)",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "0.85rem",
        }}
      >
        <div>
          <strong style={{ fontSize: "1.05em" }}>📎 Innholdsradar</strong>
          <span
            style={{
              marginLeft: "0.6rem",
              fontSize: "0.82em",
              color: "var(--theme-elevation-500)",
            }}
          >
            {run && stats
              ? `Sist: ${stats.signals ?? 0} signaler → ${stats.total ?? 0} forslag`
              : "Ikke kjørt ennå"}
          </span>
        </div>
        <a
          href="/admin/radar"
          style={{
            fontSize: "0.85em",
            color: "var(--theme-success-600)",
            textDecoration: "none",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          Se alle →
        </a>
      </div>

      {top.length === 0 ? (
        <p
          style={{
            margin: 0,
            fontSize: "0.9em",
            color: "var(--theme-elevation-500)",
          }}
        >
          Ingen forslag akkurat nå. Åpne radaren for å kjøre en ny analyse.
        </p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {top.map((s) => (
            <li
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                fontSize: "0.9em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  minWidth: "2.2rem",
                  textAlign: "center",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "var(--style-radius-s)",
                  fontSize: "0.8em",
                  fontWeight: 600,
                  background:
                    s.priority >= 80
                      ? "var(--theme-error-100)"
                      : s.priority >= 60
                        ? "var(--theme-warning-100)"
                        : "var(--theme-elevation-100)",
                  color:
                    s.priority >= 80
                      ? "var(--theme-error-700)"
                      : s.priority >= 60
                        ? "var(--theme-warning-700)"
                        : "var(--theme-elevation-600)",
                }}
              >
                {s.priority}
              </span>
              <a
                href="/admin/radar"
                style={{
                  color: "var(--theme-text)",
                  textDecoration: "none",
                }}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
