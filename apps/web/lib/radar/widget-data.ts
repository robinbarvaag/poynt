import { db, desc, eq, or } from "@poynt/on-poynt-db";
import {
  onPoyntContentSuggestion,
  onPoyntRadarRun,
} from "@poynt/on-poynt-db/schema";

/**
 * Delt datahenting for «Bindersen»: brukes både av dashbord-widgeten
 * (serverkomponent) og den flytende assistenten (via server action).
 */

export type BindersSuggestion = {
  id: string;
  title: string;
  rationale: string;
  type: string;
  priority: number;
  targetCollection: string | null;
  targetId: string | null;
  evidenceKind: string | null;
};

export type BindersRunInfo = {
  label: string;
  signals: number;
  total: number;
} | null;

export type BindersData = {
  suggestions: BindersSuggestion[];
  run: BindersRunInfo;
};

export async function getBindersWidgetData(): Promise<BindersData> {
  const [top, lastRun] = await Promise.all([
    db
      .select({
        id: onPoyntContentSuggestion.id,
        title: onPoyntContentSuggestion.title,
        rationale: onPoyntContentSuggestion.rationale,
        type: onPoyntContentSuggestion.type,
        priority: onPoyntContentSuggestion.priority,
        targetCollection: onPoyntContentSuggestion.targetCollection,
        targetId: onPoyntContentSuggestion.targetId,
        evidence: onPoyntContentSuggestion.evidence,
      })
      .from(onPoyntContentSuggestion)
      .where(
        or(
          eq(onPoyntContentSuggestion.status, "new"),
          eq(onPoyntContentSuggestion.status, "snoozed")
        )
      )
      .orderBy(desc(onPoyntContentSuggestion.priority))
      .limit(5),
    db
      .select({
        startedAt: onPoyntRadarRun.startedAt,
        stats: onPoyntRadarRun.stats,
      })
      .from(onPoyntRadarRun)
      .where(eq(onPoyntRadarRun.status, "ok"))
      .orderBy(desc(onPoyntRadarRun.startedAt))
      .limit(1),
  ]);

  const suggestions: BindersSuggestion[] = top.map((s) => ({
    id: s.id,
    title: s.title,
    rationale: s.rationale,
    type: s.type,
    priority: s.priority,
    targetCollection: s.targetCollection,
    targetId: s.targetId,
    evidenceKind:
      typeof (s.evidence as { kind?: unknown } | null)?.kind === "string"
        ? (s.evidence as { kind: string }).kind
        : null,
  }));

  const first = lastRun[0];
  const stats = first?.stats as { signals?: number; total?: number } | null;
  // Datoen formateres på serveren så klienten slipper locale-avvik ved hydrering.
  const run: BindersRunInfo = first
    ? {
        label: first.startedAt.toLocaleString("nb-NO", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
        signals: stats?.signals ?? 0,
        total: stats?.total ?? 0,
      }
    : null;

  return { suggestions, run };
}
