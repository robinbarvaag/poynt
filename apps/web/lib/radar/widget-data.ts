import { db, desc, eq, or } from "@poynt/planner-db";
import {
  plannerContentSuggestion,
  plannerRadarRun,
} from "@poynt/planner-db/schema";

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
        id: plannerContentSuggestion.id,
        title: plannerContentSuggestion.title,
        rationale: plannerContentSuggestion.rationale,
        type: plannerContentSuggestion.type,
        priority: plannerContentSuggestion.priority,
        targetCollection: plannerContentSuggestion.targetCollection,
        targetId: plannerContentSuggestion.targetId,
        evidence: plannerContentSuggestion.evidence,
      })
      .from(plannerContentSuggestion)
      .where(
        or(
          eq(plannerContentSuggestion.status, "new"),
          eq(plannerContentSuggestion.status, "snoozed")
        )
      )
      .orderBy(desc(plannerContentSuggestion.priority))
      .limit(5),
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
