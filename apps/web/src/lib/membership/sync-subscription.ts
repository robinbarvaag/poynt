import { canonicalizeEmail } from "@/lib/email-normalize";
import config from "@/payload.config";
import { db, eq } from "@poynt/planner-db";
import { plannerUser } from "@poynt/planner-db/schema";
import { getPayload } from "payload";
import type Stripe from "stripe";

export type MembershipTier = "none" | "community" | "community_ai";
export type MembershipStatus = "active" | "inactive" | "canceled" | "past_due";

/**
 * Extract membership tier from Stripe subscription metadata.
 * Falls back to price metadata, then defaults to 'community'.
 */
export function getTierFromSubscription(
  subscription: Stripe.Subscription
): MembershipTier {
  // First try subscription metadata
  const tierFromSubMeta = subscription.metadata?.tier;
  if (tierFromSubMeta === "community" || tierFromSubMeta === "community_ai") {
    return tierFromSubMeta;
  }

  // Fallback to price metadata
  const tierFromPriceMeta = subscription.items.data[0]?.price.metadata?.tier;
  if (
    tierFromPriceMeta === "community" ||
    tierFromPriceMeta === "community_ai"
  ) {
    return tierFromPriceMeta;
  }

  // Default to community with warning
  console.warn(
    `No tier metadata found on subscription ${subscription.id}, defaulting to 'community'`
  );
  return "community";
}

/**
 * Map Stripe subscription status to Payload MembershipStatus.
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
}

/**
 * Sync subscription data to Payload CMS Users collection.
 * Creates user if not found.
 */
export async function syncSubscriptionToPayload(
  params: SyncSubscriptionParams
) {
  const { email, tier, status, stripeCustomerId, stripeSubscriptionId } =
    params;

  const payload = await getPayload({ config });

  // Find existing Payload user
  const existingUsers = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existingUsers.docs.length > 0) {
    // Update existing user
    await payload.update({
      collection: "users",
      id: existingUsers.docs[0].id,
      data: {
        membershipTier: tier,
        membershipStatus: status,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
    console.log(
      `Updated Payload user ${email}: tier=${tier}, status=${status}`
    );
  } else {
    // Create new Payload user
    // Payload auth collections require a password, but user will use magic link/Google
    await payload.create({
      collection: "users",
      data: {
        email,
        password: crypto.randomUUID(), // Random password, user won't use it
        firstName: email.split("@")[0],
        lastName: "",
        role: "customer",
        membershipTier: tier,
        membershipStatus: status,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
    console.log(
      `Created Payload user ${email}: tier=${tier}, status=${status}`
    );
  }
}

interface SyncSubscriptionToDrizzleParams extends SyncSubscriptionParams {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

/**
 * Sync subscription data to Drizzle planner_user table.
 * TODO: Phase 6 - sync to planner_subscription table when it exists.
 * For now, this is a placeholder that logs the sync data.
 */
export async function syncSubscriptionToDrizzle(
  params: SyncSubscriptionToDrizzleParams
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
      `No Better Auth user found for ${email}, skipping Drizzle sync`
    );
    return;
  }

  // TODO: Phase 6 - sync to planner_subscription table
  // For now, log the sync data for future implementation
  console.log(`[Drizzle Sync Placeholder] User: ${email}`, {
    userId: existingUser[0].id,
    tier,
    status,
    stripeCustomerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  });
}
