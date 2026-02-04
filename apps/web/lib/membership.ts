import config from "@/payload.config";
import { auth } from "@poynt/planner-auth/server";
import { getPayload } from "payload";

/**
 * Valid membership tiers.
 * - none: No membership (free user, may have purchased products but not subscribed)
 * - community: Basic On Poynt membership
 * - community_ai: Community membership with AI features enabled
 */
export type MembershipTier = "none" | "community" | "community_ai";

/**
 * Membership subscription status.
 * - active: Subscription is current and paid
 * - inactive: Never had a subscription or manually deactivated
 * - canceled: User canceled but may still have access until period end
 * - past_due: Payment failed, in grace period
 */
export type MembershipStatus = "active" | "inactive" | "canceled" | "past_due";

/**
 * Membership information from Payload CMS.
 */
export interface MembershipInfo {
  tier: MembershipTier;
  status: MembershipStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Better Auth session enriched with Payload membership data.
 */
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
 * Resolve a user's membership tier from Payload CMS by email.
 * Returns null if user not found in Payload.
 *
 * @param email - User's email address
 * @returns MembershipInfo or null if not found
 */
export async function resolveMembershipTier(
  email: string
): Promise<MembershipInfo | null> {
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
    depth: 0, // No joins needed, just the user fields
  });

  if (result.docs.length === 0) return null;

  const user = result.docs[0];

  return {
    tier: (user.membershipTier as MembershipTier) || "none",
    status: (user.membershipStatus as MembershipStatus) || "inactive",
    stripeCustomerId: (user.stripeCustomerId as string) || null,
    stripeSubscriptionId: (user.stripeSubscriptionId as string) || null,
  };
}

/**
 * Get Better Auth session enriched with Payload membership data.
 * Returns null if no active session.
 * Returns session with membership.tier = 'none' if user has no Payload record.
 *
 * This is the primary function for checking membership in server components
 * and middleware. It combines Better Auth session with Payload membership data.
 *
 * @param request - Request object (from middleware or route handler)
 * @returns EnrichedSession or null if not authenticated
 *
 * @example
 * ```ts
 * // In middleware
 * const session = await getSessionWithMembership(request);
 * if (!session) return redirect('/login');
 * if (session.membership.tier === 'none') return redirect('/subscribe');
 * ```
 */
export async function getSessionWithMembership(
  request: Request
): Promise<EnrichedSession | null> {
  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) return null;

  // Enrich with Payload membership data
  const membership = await resolveMembershipTier(session.user.email);

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
    membership: membership || {
      tier: "none",
      status: "inactive",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
  };
}
