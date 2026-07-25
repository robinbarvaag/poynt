import { canonicalizeEmail } from "@/lib/email-normalize";
import { db, eq, sql } from "@poynt/planner-db";
import { plannerSubscription, plannerUser } from "@poynt/planner-db/schema";
import type { MembershipTier } from "@poynt/planner-validators";
import type Stripe from "stripe";

export type { MembershipTier };
export type MembershipStatus = "active" | "inactive" | "canceled" | "past_due";

const PAID_TIERS = ["community", "community_ai", "agency"] as const;

function isPaidTier(v: string | undefined): v is (typeof PAID_TIERS)[number] {
  return !!v && (PAID_TIERS as readonly string[]).includes(v);
}

/**
 * Extract membership tier from Stripe subscription metadata.
 * Falls back to price metadata, then defaults to 'community'.
 */
export function getTierFromSubscription(
  subscription: Stripe.Subscription
): MembershipTier {
  const tierFromSubMeta = subscription.metadata?.tier;
  if (isPaidTier(tierFromSubMeta)) {
    return tierFromSubMeta;
  }

  const tierFromPriceMeta = subscription.items.data[0]?.price.metadata?.tier;
  if (isPaidTier(tierFromPriceMeta)) {
    return tierFromPriceMeta;
  }

  console.warn(
    `No tier metadata found on subscription ${subscription.id}, defaulting to 'community'`
  );
  return "community";
}

/**
 * Map Stripe subscription status to MembershipStatus.
 */
export function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status | string
): MembershipStatus {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "incomplete":
    case "incomplete_expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}

interface SyncSubscriptionParams {
  email: string;
  tier: MembershipTier;
  status: MembershipStatus;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

/**
 * Sync subscription data to Drizzle planner_subscription table.
 * Finds the Better Auth user by canonical email, then upserts the subscription.
 */
export async function syncSubscriptionToDrizzle(
  params: SyncSubscriptionParams
) {
  const {
    email,
    tier,
    status,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = params;

  const canonical = canonicalizeEmail(email);

  // Find Better Auth user
  const existingUser = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.canonicalEmail, canonical))
    .limit(1);

  if (existingUser.length === 0) {
    console.log(
      `No Better Auth user found for ${email}, skipping subscription sync`
    );
    return;
  }

  const userId = existingUser[0].id;

  // Upsert subscription (userId is unique)
  await db
    .insert(plannerSubscription)
    .values({
      id: crypto.randomUUID(),
      userId,
      tier,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart: currentPeriodStart ?? null,
      currentPeriodEnd: currentPeriodEnd ?? null,
      cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
    })
    .onConflictDoUpdate({
      target: plannerSubscription.userId,
      set: {
        tier,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodStart: currentPeriodStart ?? null,
        currentPeriodEnd: currentPeriodEnd ?? null,
        cancelAtPeriodEnd: cancelAtPeriodEnd ?? false,
        updatedAt: sql`now()`,
      },
    });

  console.log(
    `Synced subscription for ${email}: tier=${tier}, status=${status}`
  );
}
