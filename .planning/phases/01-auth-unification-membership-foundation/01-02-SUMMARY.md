---
phase: 01-auth-unification-membership-foundation
plan: 02
subsystem: auth
tags: [stripe-webhook, membership, better-auth, payload, idempotency, drizzle]

# Dependency graph
requires:
  - phase: 01-01
    provides: Canonical email field, membership tier/status fields in Payload, Better Auth configuration
provides:
  - Idempotent Stripe webhook handling for membership purchases
  - Better Auth + Payload user creation on first membership purchase
  - Welcome email sent to new members
  - Membership tier resolution utility for session enrichment
affects: [01-03-middleware-protection, 02-membership-products, 03-access-control]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Webhook idempotency via event tracking table
    - Session enrichment pattern (Better Auth session + Payload membership data)
    - Conditional routing in webhooks based on metadata

key-files:
  created:
    - packages/planner-db/schema/webhook.ts
    - packages/planner-db/drizzle/0003_fixed_sleepwalker.sql
    - apps/web/lib/membership.ts
  modified:
    - packages/planner-db/schema/index.ts
    - packages/planner-db/index.ts
    - apps/web/app/api/webhooks/stripe/route.ts

key-decisions:
  - "Webhook idempotency via planner_webhook_event table (check before, record after)"
  - "Membership tier resolution queries Payload per-request (no caching for Phase 1)"
  - "Re-export drizzle-orm utilities from planner-db to avoid version conflicts"
  - "MembershipTier type validated at runtime before Payload write"

patterns-established:
  - "handleMembershipPurchase vs handleProductPurchase routing via metadata.productType"
  - "getSessionWithMembership(request) for enriched session in middleware/server components"
  - "Graceful handling when user exists in Better Auth but not Payload (returns tier: none)"

# Metrics
duration: ~15min (with interruption)
completed: 2026-02-04
---

# Phase 01 Plan 02: Stripe Webhook & Membership Resolution Summary

**Idempotent webhook handler for membership purchases with session enrichment utility for tier resolution**

## Performance

- **Duration:** ~15 min (with session interruption)
- **Started:** 2026-02-04T20:31:57Z
- **Completed:** 2026-02-04T22:40:13Z
- **Tasks:** 2
- **Files created:** 3
- **Files modified:** 3

## Accomplishments

- Webhook event tracking table (planner_webhook_event) for idempotency
- Stripe webhook routes membership vs product purchases based on metadata
- Membership purchase creates Better Auth user with canonical email (if not exists)
- Membership purchase creates/updates Payload user with tier and Stripe IDs
- Welcome email sent to new members on first purchase
- getSessionWithMembership() enriches Better Auth session with Payload membership data
- Type exports available for downstream consumers (MembershipTier, MembershipStatus, etc.)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create webhook event tracking table and update Stripe webhook for membership purchase** - `5ef718b` (feat)
2. **Task 2: Create membership tier resolution utility for session enrichment** - `649bea2` (feat)

## Files Created/Modified

- `packages/planner-db/schema/webhook.ts` - Webhook event tracking table for idempotency
- `packages/planner-db/drizzle/0003_fixed_sleepwalker.sql` - Migration for webhook table
- `packages/planner-db/schema/index.ts` - Added webhook export
- `packages/planner-db/index.ts` - Re-export drizzle-orm utilities (eq, and, or, etc.)
- `apps/web/app/api/webhooks/stripe/route.ts` - Added membership handling and idempotency
- `apps/web/lib/membership.ts` - Membership tier resolution utility

## Decisions Made

1. **Webhook idempotency pattern:** Check event ID before processing, record after success. This ensures failed webhooks can be retried while preventing duplicate processing.

2. **No caching for membership resolution:** getSessionWithMembership queries Payload on every call. Better Auth session is cached (1-hour cookie cache), but Payload query is fresh. Acceptable for Phase 1; can add Redis caching in Phase 6 if needed.

3. **Drizzle-orm re-exports:** Added re-exports of common drizzle-orm utilities (eq, and, or, sql, etc.) from planner-db package to avoid version conflicts when web app imports both.

4. **Graceful missing user handling:** If user exists in Better Auth but not Payload, return tier "none" rather than throwing. This handles edge cases where a user signed up via Google before purchasing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Re-exported drizzle-orm utilities from planner-db**
- **Found during:** Task 1 (webhook implementation)
- **Issue:** Web app importing `eq` from drizzle-orm directly caused type conflicts due to multiple drizzle-orm versions in node_modules
- **Fix:** Added re-exports of common drizzle-orm utilities from planner-db/index.ts, updated webhook route to import from @poynt/planner-db
- **Files modified:** packages/planner-db/index.ts, apps/web/app/api/webhooks/stripe/route.ts
- **Commit:** 5ef718b

**2. [Rule 1 - Bug] Fixed MembershipTier type validation**
- **Found during:** Task 1 (webhook implementation)
- **Issue:** Passing `session.metadata?.tier as string` to Payload caused type error since Payload expects literal union type
- **Fix:** Added runtime validation that tier is one of valid MembershipTier values before passing to Payload
- **Files modified:** apps/web/app/api/webhooks/stripe/route.ts
- **Commit:** 5ef718b

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for type safety and avoiding runtime errors. No scope creep.

## Issues Encountered

1. **Drizzle-orm version conflicts:** Multiple versions of drizzle-orm in node_modules (0.38.4, 0.44.7, 0.45.1) due to different packages requiring different versions. Resolved by re-exporting from planner-db package to ensure consistent types.

2. **Drizzle push interactive prompt:** The `drizzle-kit push` command prompts for confirmation on schema changes. Resolved by manually executing migration SQL via a temporary script.

## Pre-existing Issues

The following type errors exist in the codebase but are unrelated to this plan:
- Type errors in cart-drawer.tsx, header.tsx, product-detail.tsx (string vs undefined types)
- These appear to be UI component prop type mismatches, not blocking for auth work

## Next Phase Readiness

**Ready for phase 01-03 (Middleware Protection):**
- getSessionWithMembership() available for middleware tier checks
- Membership data flows from Stripe purchase through to session enrichment
- Idempotent webhook handling ensures reliable user creation

**No blockers.**

**Next steps:**
- 01-03 will use getSessionWithMembership() in middleware to protect On Poynt routes
- Membership checkout pages will set metadata.productType = "membership" and metadata.tier
- Future phases will add subscription lifecycle webhooks (renewal, cancellation, etc.)

---
*Phase: 01-auth-unification-membership-foundation*
*Completed: 2026-02-04*
