import { db, eq } from "@poynt/planner-db";
import { plannerContentSuggestion } from "@poynt/planner-db/schema";
import type {
  ContentRadarOutput,
  RadarSignalInput,
} from "@poynt/planner-validators";

export interface PersistStats {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

/**
 * Lagrer AI-forslagene med stabil identitet (`dedupKey = type:signalKey`):
 * - finnes det ikke → opprett som "new"
 * - finnes det → oppdater innhold + prioritet, men BEHOLD status (snoozed/done)
 * - er det "dismissed" → rør det ikke (avviste forslag skal aldri gjenoppstå)
 *
 * Prioritet og evidens hentes deterministisk fra signalet AI-en refererte til,
 * ikke fra AI-en selv. Se docs/CONTENT-RADAR.md.
 */
export async function persistSuggestions(
  output: ContentRadarOutput,
  signals: RadarSignalInput[],
  runId: string
): Promise<PersistStats> {
  const signalByKey = new Map(signals.map((s) => [s.key, s]));
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const s of output.suggestions) {
    const sig = signalByKey.get(s.signalKey);
    const dedupKey = `${s.type}:${s.signalKey}`;
    const priority = sig?.priority ?? 40;
    const evidence = sig
      ? { signalKey: sig.key, kind: sig.kind, summary: sig.summary }
      : { signalKey: s.signalKey };
    const targetCollection = s.targetCollection ?? sig?.targetCollection ?? null;
    const targetId = s.targetId ?? sig?.targetId ?? null;
    const category = s.category ?? sig?.category ?? null;

    const [existing] = await db
      .select({
        id: plannerContentSuggestion.id,
        status: plannerContentSuggestion.status,
      })
      .from(plannerContentSuggestion)
      .where(eq(plannerContentSuggestion.dedupKey, dedupKey))
      .limit(1);

    if (existing) {
      if (existing.status === "dismissed") {
        skipped += 1;
        continue;
      }
      await db
        .update(plannerContentSuggestion)
        .set({
          type: s.type,
          title: s.title,
          rationale: s.rationale,
          priority,
          evidence,
          targetCollection,
          targetId,
          category,
          source: "radar",
          runId,
        })
        .where(eq(plannerContentSuggestion.id, existing.id));
      updated += 1;
    } else {
      await db.insert(plannerContentSuggestion).values({
        dedupKey,
        type: s.type,
        title: s.title,
        rationale: s.rationale,
        priority,
        status: "new",
        evidence,
        source: "radar",
        runId,
        targetCollection,
        targetId,
        category,
      });
      created += 1;
    }
  }

  return { created, updated, skipped, total: output.suggestions.length };
}
