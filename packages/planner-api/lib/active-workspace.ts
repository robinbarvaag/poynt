import { db } from "@poynt/planner-db";
import {
  plannerUserPreferences,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

/**
 * Brukerens AKTIVE arbeidsområde — det som er valgt i workspace-switcheren
 * (lagret på `plannerUserPreferences.activeWorkspaceId`), ikke bare «første
 * medlemskap». Dette er den ENE kilden til sannhet for data-scoping.
 *
 * Tidligere hadde hver router sin egen kopi som returnerte første medlemskap og
 * ignorerte det valgte arbeidsområdet — derfor viste bytte/oppretting av bedrift
 * fortsatt den forrige bedriftens data (markedsplan, oppgaver, profil osv.).
 *
 * Faller tilbake til første medlemskap hvis ingenting er valgt, eller hvis det
 * valgte ikke lenger er tilgjengelig (mistet medlemskap / slettet bedrift).
 * Kaster NOT_FOUND hvis brukeren ikke er medlem noe sted.
 */
export async function getActiveWorkspaceId(userId: string): Promise<string> {
  const prefs = await db.query.plannerUserPreferences.findFirst({
    where: eq(plannerUserPreferences.userId, userId),
  });

  if (prefs?.activeWorkspaceId) {
    // Verifiser at brukeren fortsatt har tilgang til det valgte arbeidsområdet.
    const member = await db.query.plannerWorkspaceMember.findFirst({
      where: and(
        eq(plannerWorkspaceMember.userId, userId),
        eq(plannerWorkspaceMember.workspaceId, prefs.activeWorkspaceId)
      ),
    });
    if (member) return prefs.activeWorkspaceId;
  }

  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: eq(plannerWorkspaceMember.userId, userId),
  });
  if (!membership) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No workspace found for user",
    });
  }
  return membership.workspaceId;
}
