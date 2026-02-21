import { auth } from "@poynt/planner-auth/server";
import { db, eq } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";

export type MembershipTier = "none" | "community" | "community_ai";
export type MembershipStatus = "active" | "inactive" | "canceled" | "past_due";

export interface MembershipInfo {
  tier: MembershipTier;
  status: MembershipStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

export interface EnrichedSession {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  session: {
    id: string;
    expiresAt: Date;
    token: string;
  };
  membership: MembershipInfo;
}

/**
 * Get Better Auth session enriched with membership data from Drizzle.
 * Returns null if no active session.
 */
export async function getSessionWithMembership(
  request: Request
): Promise<EnrichedSession | null> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return null;

  // Look up subscription directly by userId — no email bridge needed
  const subscriptions = await db
    .select()
    .from(plannerSubscription)
    .where(eq(plannerSubscription.userId, session.user.id))
    .limit(1);

  const sub = subscriptions[0];

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image || null,
    },
    session: {
      id: session.session.id,
      expiresAt: session.session.expiresAt,
      token: session.session.token,
    },
    membership: sub
      ? {
          tier: sub.tier as MembershipTier,
          status: sub.status as MembershipStatus,
          stripeCustomerId: sub.stripeCustomerId,
          stripeSubscriptionId: sub.stripeSubscriptionId,
          currentPeriodEnd: sub.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
        }
      : {
          tier: "none",
          status: "inactive",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
  };
}
