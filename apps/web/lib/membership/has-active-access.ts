import type { MembershipInfo } from "../membership";

/**
 * Determines if a user has active access to the On Poynt platform.
 *
 * Rules:
 * - "none" tier = no access
 * - "active" status = always has access
 * - "canceled" with future currentPeriodEnd = still has access until period ends
 * - "past_due" = grace period, still has access (Stripe retries for ~7 days)
 * - All other combinations = no access
 */
export function hasActiveAccess(membership: MembershipInfo): boolean {
  const { tier, status, currentPeriodEnd } = membership;

  if (tier === "none") return false;
  if (status === "active") return true;

  // Canceled but still within paid period
  if (
    status === "canceled" &&
    currentPeriodEnd &&
    currentPeriodEnd > new Date()
  ) {
    return true;
  }

  // Past due: Stripe retries payment, give grace period
  if (status === "past_due") return true;

  return false;
}
