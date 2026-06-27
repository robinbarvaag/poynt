import {
  buildICalendar,
  planToEvents,
  scheduledIdeaSet,
  scheduledPostsToEvents,
  verifyWorkspaceSig,
} from "@/lib/planner/calendar-feed";
import { and, db, desc, eq } from "@poynt/planner-db";
import { plannerToolResult } from "@poynt/planner-db/schema";
import type { YearlyPlan } from "@poynt/planner-validators";

/**
 * Offentlig (signert) .ics-abonnementsfeed for et arbeidsområdes årshjul.
 *
 * Kalender-apper (Apple/Google/Outlook) kan ikke logge inn, så lenken sikres
 * med en HMAC-signatur i stedet for sesjon. Eksporterer det sist lagrede
 * årshjulet som heldags-hendelser. Endrer brukeren årshjulet, henter appen
 * automatisk den nye versjonen ved neste synk.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ workspace: string; sig: string }> }
) {
  const { workspace, sig } = await params;

  if (!verifyWorkspaceSig(workspace, sig)) {
    return new Response("Forbidden", { status: 403 });
  }

  // Sist lagrede årshjul + alle planlagte/lagrede innlegg parallelt.
  const [[planRow], scheduledRows] = await Promise.all([
    db
      .select({ result: plannerToolResult.result })
      .from(plannerToolResult)
      .where(
        and(
          eq(plannerToolResult.workspaceId, workspace),
          eq(plannerToolResult.toolId, "yearly-planner")
        )
      )
      .orderBy(desc(plannerToolResult.createdAt))
      .limit(1),
    db
      .select({ id: plannerToolResult.id, result: plannerToolResult.result })
      .from(plannerToolResult)
      .where(
        and(
          eq(plannerToolResult.workspaceId, workspace),
          eq(plannerToolResult.toolId, "generated-post")
        )
      ),
  ]);

  const scheduled = scheduledRows as {
    id: string;
    result: {
      caption?: string;
      hashtags?: string[];
      channel?: string;
      idea?: string;
      scheduledDate?: string | null;
    } | null;
  }[];

  // Faktiske planlagte innlegg først, så årshjul-forslag (dedup mot dem).
  const scheduledEvents = scheduledPostsToEvents(scheduled, workspace);
  const plan = (planRow?.result as { plan?: YearlyPlan } | null)?.plan ?? null;
  const planEvents = plan
    ? planToEvents(plan, workspace, scheduledIdeaSet(scheduled))
    : [];
  const ics = buildICalendar([...scheduledEvents, ...planEvents], new Date());

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="poynt-arshjul.ics"',
      // La kalender-apper cache i en time mellom synk-er.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
