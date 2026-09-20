import { count, db, eq, inArray } from "@poynt/planner-db";
import {
  plannerSubscription,
  plannerUser,
  plannerWorkspace,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import { getStripe } from "@poynt/stripe";

/**
 * Selve slettingen av et On Poynt-medlem, skilt fra server-handlingen i
 * `admin/actions/members.ts`.
 *
 * Ligger her fordi en irreversibel operasjon skal kunne kjøres og verifiseres
 * uten å gå veien om admin-innlogging. Handlingen over eier autorisering og
 * bekreftelse; denne fila eier hva som faktisk skjer i databasen.
 */

export interface SoloWorkspace {
  id: string;
  name: string;
}

/**
 * Bedriftene der personen er eneste medlem.
 *
 * `planner_workspace` har ingen eier-kolonne — eierskap ligger bare i
 * medlemskapstabellen. Sletter vi brukeren uten å rydde, forsvinner
 * medlemskapsraden (cascade), og bedriften blir stående igjen uten et eneste
 * medlem: usynlig for alle, men fortsatt med merkevaredata og
 * verktøyresultater i basen.
 */
export async function findSoloWorkspaces(
  userId: string
): Promise<SoloWorkspace[]> {
  const memberships = await db
    .select({ workspaceId: plannerWorkspaceMember.workspaceId })
    .from(plannerWorkspaceMember)
    .where(eq(plannerWorkspaceMember.userId, userId));

  const solo: SoloWorkspace[] = [];

  for (const { workspaceId } of memberships) {
    const [{ total }] = await db
      .select({ total: count() })
      .from(plannerWorkspaceMember)
      .where(eq(plannerWorkspaceMember.workspaceId, workspaceId));

    if (total > 1) continue;

    const [workspace] = await db
      .select({ id: plannerWorkspace.id, name: plannerWorkspace.name })
      .from(plannerWorkspace)
      .where(eq(plannerWorkspace.id, workspaceId))
      .limit(1);

    if (workspace) solo.push(workspace);
  }

  return solo;
}

/**
 * Sletter personen og alt som henger på dem.
 *
 * Det meste følger med via `ON DELETE CASCADE` (sesjoner, abonnement,
 * kursframgang, chat-medlemskap, bedriftsmedlemskap). Medlemssøknaden og
 * samtaler de har startet overlever med `set null` — søknaden er
 * dokumentasjon på hva som ble avtalt, og en samtale skal ikke forsvinne for
 * de andre deltakerne.
 *
 * Kaller IKKE autorisering eller bekreftelse: det er server-handlingens jobb.
 */
export async function purgeMember(userId: string) {
  // Stripe vet ingenting om databasen vår — uten dette ville personen blitt
  // fakturert videre for et medlemskap som ikke finnes lenger.
  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  if (sub?.stripeSubscriptionId) {
    try {
      await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      // Er abonnementet allerede kansellert i Stripe, er dette forventet.
      // Andre feil skal ikke blokkere slettingen, men må være synlige.
      console.error(
        `[medlemmer] kunne ikke kansellere Stripe-abonnement ${sub.stripeSubscriptionId}:`,
        err
      );
    }
  }

  const soloWorkspaces = await findSoloWorkspaces(userId);
  if (soloWorkspaces.length > 0) {
    await db.delete(plannerWorkspace).where(
      inArray(
        plannerWorkspace.id,
        soloWorkspaces.map((workspace) => workspace.id)
      )
    );
  }

  await db.delete(plannerUser).where(eq(plannerUser.id, userId));

  return { deletedWorkspaces: soloWorkspaces.map((w) => w.name) };
}
