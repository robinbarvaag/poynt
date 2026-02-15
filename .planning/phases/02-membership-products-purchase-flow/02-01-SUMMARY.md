---
phase: 02-membership-products-purchase-flow
plan: 01
subsystem: payments
tags: [stripe, subscriptions, checkout, membership, pricing]

# Dependency graph
requires:
  - phase: 01-auth-unification-membership-foundation
    provides: Payload Users with membershipTier field, email normalization, webhook handler foundation
provides:
  - Membership pricing page at /medlemskap with 4 billing period options
  - Dedicated Stripe Checkout API for subscription purchases
  - Price creation utility for seeding Stripe with recurring prices
  - Environment variable configuration for Stripe Price IDs
affects: [02-02-subscription-webhooks, 02-03-post-purchase-experience]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Separate checkout flows for subscriptions vs one-time products
    - Stripe recurring prices with interval_count for flexible billing periods
    - Environment variables for Stripe resource IDs

key-files:
  created:
    - apps/web/src/lib/stripe/create-membership-prices.ts
    - apps/web/app/api/checkout/membership/route.ts
    - apps/web/app/(frontend)/medlemskap/page.tsx
    - apps/web/app/(frontend)/medlemskap/layout.tsx
  modified: []

key-decisions:
  - "Separate checkout flows: membership uses mode=subscription, digital products use mode=payment"
  - "4 billing periods (1/3/6/12 months) with tiered savings (10%, 15%, 20%)"
  - "Environment variables for Stripe Price IDs to support multiple environments"
  - "Community tier only for v1 (community_ai tier deferred to later plan)"

patterns-established:
  - "MEMBERSHIP_PRICING constant as single source of truth for pricing display and API"
  - "Metadata pattern: productType on checkout session, tier on both session and subscription_data"
  - "Norwegian-first UI copy with savings percentages for longer billing periods"

# Metrics
duration: 3min
completed: 2026-02-15
---

# Phase 2 Plan 1: Membership Checkout Flow Summary

**Stripe subscription checkout with 4 billing periods (1/3/6/12 months) and dedicated pricing page at /medlemskap**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-15T21:14:15Z
- **Completed:** 2026-02-15T21:17:09Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created membership pricing page at /medlemskap with interactive billing period selector showing 1, 3, 6, and 12 month options with tiered savings
- Built dedicated POST /api/checkout/membership endpoint creating Stripe Checkout Sessions in subscription mode (separate from digital product checkout)
- Implemented MEMBERSHIP_PRICING constant and createMembershipPrices utility for seeding Stripe with recurring prices using interval_count
- Metadata attached to checkout sessions enables downstream webhook processing to identify membership purchases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create membership checkout API and price utility** - `b861649` (feat)
2. **Task 2: Create membership pricing page at /medlemskap** - `18dbb4d` (feat)

**Plan metadata:** (will be committed after SUMMARY creation)

## Files Created/Modified

- `apps/web/src/lib/stripe/create-membership-prices.ts` - Pricing constant (NOK øre amounts) and utility to create 4 Stripe Prices with recurring.interval_count for 1/3/6/12 months
- `apps/web/app/api/checkout/membership/route.ts` - POST endpoint accepting priceId and tier, creating subscription-mode checkout with metadata for webhook routing
- `apps/web/app/(frontend)/medlemskap/page.tsx` - Client-side pricing selector with Norwegian copy, savings indicators, and checkout button calling membership API
- `apps/web/app/(frontend)/medlemskap/layout.tsx` - Layout wrapper with SEO metadata for membership page

## Decisions Made

**Cart separation strategy:** Membership products bypass cart entirely and use dedicated checkout flow. This avoids Stripe's mode conflict (subscription vs payment) and simplifies UX. Users cannot mix membership with digital products in single checkout.

**Pricing structure:** 1 month = 999 NOK/month (base), 3 months = 899 NOK/month (10% savings), 6 months = 849 NOK/month (15% savings), 12 months = 799 NOK/month (20% savings). Pricing optimized for annual commitment while offering monthly flexibility.

**Environment variable approach:** Stripe Price IDs stored as NEXT_PUBLIC_MEMBERSHIP_PRICE_1M, NEXT_PUBLIC_MEMBERSHIP_PRICE_3M, NEXT_PUBLIC_MEMBERSHIP_PRICE_6M, NEXT_PUBLIC_MEMBERSHIP_PRICE_12M. Enables different price IDs per environment (dev/staging/prod) and supports price updates without code changes.

**Community tier only:** Plan implements only 'community' tier. The 'community_ai' tier structure is present but not exposed in UI. This simplifies initial rollout while infrastructure supports future tier expansion.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

**Manual setup needed after deployment:**

1. **Create Stripe Product for Membership:**
   - Log into Stripe Dashboard
   - Navigate to Products → Create Product
   - Name: "On Poynt Medlemskap" or similar
   - Copy Product ID (starts with `prod_`)

2. **Run Price Creation Utility:**
   ```typescript
   // In Next.js dev console or script
   import { createMembershipPrices } from '@/src/lib/stripe/create-membership-prices';
   const prices = await createMembershipPrices('prod_XXXXX', 'community');
   console.log(prices.map(p => ({ months: p.recurring?.interval_count, id: p.id })));
   ```

3. **Configure Environment Variables:**
   Add to `.env.local` and production environment:
   ```
   NEXT_PUBLIC_MEMBERSHIP_PRICE_1M=price_XXXXX
   NEXT_PUBLIC_MEMBERSHIP_PRICE_3M=price_XXXXX
   NEXT_PUBLIC_MEMBERSHIP_PRICE_6M=price_XXXXX
   NEXT_PUBLIC_MEMBERSHIP_PRICE_12M=price_XXXXX
   ```

4. **Test Checkout Flow:**
   - Visit `/medlemskap`
   - Select billing period
   - Click "Bli medlem"
   - Verify redirect to Stripe Checkout with correct price

Until these steps are complete, the membership pricing page will show "Medlemskapspriser er ikke konfigurert" error when attempting checkout.

## Next Phase Readiness

**Ready for Plan 02-02 (Subscription Webhooks & Welcome Email):**
- Checkout creates Stripe subscriptions with proper metadata (productType, tier)
- subscription_data.metadata.tier attached for lifecycle webhook processing
- Success URL redirects to /medlemskap/bekreftelse (to be built in Plan 02-03)

**Blockers/Concerns:**
- Stripe Price IDs must be manually configured before testing end-to-end flow
- Webhook handler (Plan 02-02) required before subscription activation works
- User will complete purchase but won't get membership access until webhook processes subscription.created event

---
*Phase: 02-membership-products-purchase-flow*
*Completed: 2026-02-15*
