---
phase: 01-auth-unification-membership-foundation
plan: 01
subsystem: auth
tags: [better-auth, drizzle, payload, google-oauth, magic-link, resend, email-normalization]

# Dependency graph
requires:
  - phase: 00-setup
    provides: Initial project structure with Payload CMS, Better Auth, and Drizzle ORM
provides:
  - Canonical email schema field in plannerUser table with indexing
  - Membership tier and status fields in Payload Users collection
  - Email normalization utility for preventing duplicate accounts
  - Google OAuth social login configuration in Better Auth
  - Magic link authentication via Resend email service
  - 30-day session persistence with cookie caching
affects: [01-02-account-linking, 01-03-stripe-sync, 02-membership-products]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Email canonicalization for Gmail dots, plus-tags, case normalization
    - Better Auth plugin pattern for magic link authentication
    - Session cookie caching for performance

key-files:
  created:
    - apps/web/lib/email-normalize.ts
    - packages/planner-db/drizzle/0001_violet_bromley.sql
    - packages/planner-db/drizzle/0002_gray_puppet_master.sql
  modified:
    - packages/planner-db/schema/auth.ts
    - apps/web/src/collections/users.ts
    - packages/planner-auth/server.ts
    - packages/planner-auth/client.ts
    - packages/email/index.ts

key-decisions:
  - "Manual email normalization implementation for transparency (zero dependencies)"
  - "Disabled email+password auth - members use Google OAuth or magic link only"
  - "30-day session expiry with 1-hour cookie cache for performance"
  - "Added email package as dependency to planner-auth for magic link integration"

patterns-established:
  - "Canonical email stored on every plannerUser row for duplicate prevention"
  - "Membership fields (tier, status, subscriptionId) stored in Payload Users sidebar"
  - "Better Auth magic link sends Norwegian-language emails via Resend"

# Metrics
duration: 8min
completed: 2026-02-04
---

# Phase 01 Plan 01: Schema & Auth Foundation Summary

**Canonical email indexing, membership tier fields in Payload, Google OAuth + magic link authentication with 30-day sessions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-04T21:18:54Z
- **Completed:** 2026-02-04T21:27:17Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- plannerUser table has canonicalEmail field with index for fast duplicate detection
- Payload Users collection displays membershipTier, membershipStatus, stripeSubscriptionId in admin sidebar
- Better Auth configured with Google social login and magic link plugin
- Email normalization utility handles Gmail dots, plus-tags, and case differences
- 30-day session persistence with 1-hour cookie cache for performance

## Task Commits

Each task was committed atomically:

1. **Task 1: Add canonical email to Drizzle schema, membership fields to Payload Users, and create email normalization utility** - `6d5b648` (feat)
2. **Task 2: Configure Better Auth with Google social login, magic link plugin, and session persistence** - `71b0df2` (feat)

## Files Created/Modified
- `packages/planner-db/schema/auth.ts` - Added canonicalEmail field to plannerUser table with index
- `packages/planner-db/drizzle/0001_violet_bromley.sql` - Migration to add canonical_email column
- `packages/planner-db/drizzle/0002_gray_puppet_master.sql` - Migration to add default value
- `apps/web/src/collections/users.ts` - Added membershipTier, membershipStatus, stripeSubscriptionId fields
- `apps/web/lib/email-normalize.ts` - Email canonicalization utility (Gmail, Outlook, Yahoo)
- `packages/planner-auth/server.ts` - Configured Google OAuth, magic link, 30-day sessions
- `packages/planner-auth/client.ts` - Added magicLinkClient plugin
- `packages/planner-auth/package.json` - Added @poynt/email dependency
- `packages/email/index.ts` - Added sendWelcomeEmail function

## Decisions Made

1. **Manual email normalization:** Implemented canonicalization manually instead of using npm package for transparency and zero dependencies. Handles Gmail dots, plus-tags, and case normalization for all major providers.

2. **Disabled email+password auth:** Better Auth now only supports Google OAuth and magic link. Members cannot register with email/password. This simplifies the auth flow and improves security.

3. **Session configuration:** 30-day expiry with 1-hour cookie cache balances security (long session lifetime) with performance (reduced database queries).

4. **Email package dependency:** Added @poynt/email as dependency to planner-auth to enable magic link sending via Resend. This creates a clear dependency boundary.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @poynt/email dependency to planner-auth**
- **Found during:** Task 2 (Better Auth configuration)
- **Issue:** planner-auth/server.ts imports getResend from @poynt/email, but email package wasn't in dependencies. TypeScript compilation failed.
- **Fix:** Added `"@poynt/email": "workspace:*"` to planner-auth/package.json and ran `bun install`
- **Files modified:** packages/planner-auth/package.json, bun.lock
- **Verification:** Typecheck passes in planner-auth package
- **Committed in:** 71b0df2 (Task 2 commit)

**2. [Rule 3 - Blocking] Added default value for canonical_email migration**
- **Found during:** Task 1 (Schema migration)
- **Issue:** Adding NOT NULL column without default value caused Drizzle migration to prompt for table truncation (1 existing row would be lost)
- **Fix:** Modified schema to include `.default("")` on canonicalEmail field, then applied migration with manual backfill script (set canonical_email = LOWER(email) for existing rows)
- **Files modified:** packages/planner-db/schema/auth.ts, created temporary migrate-canonical-email.ts (deleted after use)
- **Verification:** Migration applied successfully, existing row preserved with canonical_email backfilled
- **Committed in:** 6d5b648 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary to unblock execution. Adding email dependency was required for import resolution. Migration default value prevented data loss. No scope creep.

## Issues Encountered

1. **Interactive Drizzle push prompt:** The `drizzle-kit push` command prompted for confirmation when adding NOT NULL column to table with existing rows. Interactive prompts don't work well with automation. Resolved by creating a one-time migration script that manually executed SQL to add column with default, create index, and backfill existing rows.

2. **Better Auth package structure:** Needed to verify correct import paths for magicLink plugin. Inspected node_modules structure and package.json exports to confirm `better-auth/plugins` and `better-auth/client/plugins` were correct paths.

## User Setup Required

**External services require manual configuration.** See [01-USER-SETUP.md](./01-USER-SETUP.md) for:
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables
- Google Cloud Console OAuth 2.0 Client configuration
- Authorized redirect URIs for production and development

Note: Better Auth will gracefully handle missing credentials (Google OAuth will be disabled), but users won't be able to use Google social login until configured.

## Next Phase Readiness

**Ready for phase 01-02 (Account Linking):**
- Canonical email field exists for matching Payload and Better Auth users
- Membership fields ready to be synced from Stripe subscriptions
- Better Auth configured for production authentication flow

**No blockers.**

**Next steps:**
- 01-02 will implement account linking logic using canonicalEmail
- 01-03 will sync Stripe subscription data to membershipTier/Status fields
- Email normalization will be used in webhook handlers to match users across systems

---
*Phase: 01-auth-unification-membership-foundation*
*Completed: 2026-02-04*
