"use server";

import { db, eq, sql } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";
import { getStripe } from "@poynt/stripe";

type MembershipTier = "none" | "community" | "community_ai" | "agency";

export async function changeMemberTier(
  userId: string,
  newTier: MembershipTier
) {
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

export async function deactivateMember(userId: string) {
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
