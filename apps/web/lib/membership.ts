import { db, eq } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";
import { auth } from "@poynt/planner-auth/server";

export type MembershipTier = "none" | "community" | "community_ai";
export type MembershipStatus = "active" | "inactive" | "canceled" | "past_due";

export interface MembershipInfo {
  tier: MembershipTier;
  status: MembershipStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
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
        }
      : {
          tier: "none",
          status: "inactive",
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        },
  };
}
