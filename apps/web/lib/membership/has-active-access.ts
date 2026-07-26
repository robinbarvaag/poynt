import { hasAiTools } from "@poynt/planner-validators";
import type { MembershipInfo } from "../membership";

/**
 * Nivåene som låser opp AI-verktøyene. «agency» (Byrå) arver alt fra
 * Community AI, så all AI-gating skal sjekke begge — bruk denne i stedet for
 * `tier === "community_ai"` (som ville stengt byrå-kunder ute).
 *
 * Selve definisjonen bor nå i `@poynt/planner-validators` (delt med
 * `packages/planner-api`); re-eksporteres her for eksisterende importerere.
 */
export { hasAiTools };

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
