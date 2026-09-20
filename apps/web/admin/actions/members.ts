"use server";

import { findSoloWorkspaces, purgeMember } from "@/lib/members/delete-member";
import { requireAdmin } from "@/lib/require-admin";
import { count, db, eq, inArray, sql } from "@poynt/planner-db";
import {
  plannerSubscription,
  plannerUser,
  plannerWorkspace,
  plannerWorkspaceMember,
} from "@poynt/planner-db/schema";
import { getStripe } from "@poynt/stripe";

type MembershipTier = "none" | "community" | "community_ai" | "agency";

export async function changeMemberTier(
  userId: string,
  newTier: MembershipTier
) {
  await requireAdmin();
  await db
    .update(plannerSubscription)
    .set({ tier: newTier, updatedAt: sql`now()` })
    .where(eq(plannerSubscription.userId, userId));

  // Update Stripe metadata if subscription exists
  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  if (sub?.stripeSubscriptionId) {
    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      metadata: { tier: newTier },
    });
  }

  return { success: true };
}

/**
 * Pause eller gjenåpne tilgangen — uten å røre Stripe eller nivået.
 *
 * Dette er det reversible alternativet til `endMembership`: personen mister
 * tilgang til On Poynt, men abonnementet og nivået står urørt, så ett klikk
 * setter dem tilbake der de var. Bruk det når noen skal stoppes midlertidig,
 * ikke når medlemskapet faktisk er over.
 */
export async function setMemberStatus(
  userId: string,
  status: "active" | "inactive"
) {
  await requireAdmin();

  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  if (!sub) {
    // Uten abonnementsrad finnes det ingen status å endre. Det gjelder blant
    // annet folk som har logget inn, men aldri blitt medlem.
    return { success: false, error: "Personen har ikke noe medlemskap ennå." };
  }

  await db
    .update(plannerSubscription)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(plannerSubscription.userId, userId));

  return { success: true };
}

/**
 * Avslutter medlemskapet for godt: kansellerer Stripe-abonnementet og setter
 * nivået til «ingen». Veien tilbake er å sette opp medlemskapet på nytt.
 * Skal noen bare stoppes midlertidig, bruk `setMemberStatus` i stedet.
 */
export async function endMembership(userId: string) {
  await requireAdmin();
  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  // Cancel Stripe subscription first (if exists)
  if (sub?.stripeSubscriptionId) {
    const stripe = getStripe();
    try {
      await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } catch (err) {
      console.error("Failed to cancel Stripe subscription:", err);
    }
  }

  // Update Drizzle
  await db
    .update(plannerSubscription)
    .set({
      tier: "none",
      status: "canceled",
      updatedAt: sql`now()`,
    })
    .where(eq(plannerSubscription.userId, userId));

  return { success: true };
}

export interface DeletePreview {
  name: string;
  email: string;
  /** Bedrifter som slettes sammen med personen (ingen andre er medlem). */
  soloWorkspaces: { id: string; name: string }[];
  /** Er det et aktivt Stripe-abonnement som må kanselleres? */
  hasActiveStripeSubscription: boolean;
  isAdmin: boolean;
}

/**
 * Hva skjer hvis vi sletter? Leses før bekreftelsesdialogen, slik at
 * advarselen nevner den faktiske bedriften ved navn i stedet for en generisk
 * «dette kan ikke angres».
 */
export async function previewMemberDeletion(
  userId: string
): Promise<DeletePreview | null> {
  await requireAdmin();

  const [user] = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.id, userId))
    .limit(1);

  if (!user) return null;

  const [sub] = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, userId))
    .limit(1);

  return {
    name: user.name,
    email: user.email,
    soloWorkspaces: await findSoloWorkspaces(userId),
    hasActiveStripeSubscription: Boolean(sub?.stripeSubscriptionId),
    isAdmin: user.role === "admin" || user.role === "super_admin",
  };
}

/**
 * Sletter personen og alt som henger på dem. Selve databasearbeidet ligger i
 * `lib/members/delete-member.ts`; her eier vi autorisering og bekreftelse.
 *
 * `confirmEmail` må stemme med personens e-post. Det er ikke teater: uten den
 * sjekken er avstanden mellom «slett testbrukeren» og «slett et betalende
 * medlem» én feilklikket rad i en liste.
 */
export async function deleteMember(userId: string, confirmEmail: string) {
  await requireAdmin();

  const [user] = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.id, userId))
    .limit(1);

  if (!user) {
    return { success: false as const, error: "Fant ikke personen." };
  }

  if (confirmEmail.trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return {
      success: false as const,
      error: "E-postadressen stemmer ikke. Ingenting er slettet.",
    };
  }

  const { deletedWorkspaces } = await purgeMember(userId);

  console.warn(
    `[medlemmer] slettet ${user.email}${
      deletedWorkspaces.length
        ? ` + ${deletedWorkspaces.length} bedrift(er): ${deletedWorkspaces.join(", ")}`
        : ""
    }`
  );

  return { success: true as const, deletedWorkspaces };
}
