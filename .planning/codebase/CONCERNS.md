# Codebase Concerns

**Analysis Date:** 2026-02-03

## Tech Debt

**Inconsistent Stripe Field Naming:**
- Issue: Product collection uses `stripeID` in hooks but schema stores `stripeProductId` and `stripePriceId`. Generated types export `stripeID` field that doesn't exist in schema.
- Files: `apps/web/src/collections/products.ts`, `apps/web/payload-types.ts`
- Impact: Type mismatch between hook logic and actual database fields. Future product updates may fail if `stripeID` field is referenced but missing.
- Fix approach: Standardize on `stripeProductId` throughout. Update afterChange hook to use consistent field names. Regenerate Payload types after fix.

**Missing Invitation Email Implementation:**
- Issue: Workspace invitation system creates tokens but doesn't send emails to invitees.
- Files: `packages/planner-api/routers/workspace.ts` (line 342)
- Impact: Users receive invites but have no way to discover or accept them without direct URL sharing.
- Fix approach: Integrate `@poynt/email` package into workspace invite procedure. Use invitation token to generate acceptance link.

**Payload Auto-Push Disabled Without Alternative Migration Strategy:**
- Issue: `apps/web/payload.config.ts` explicitly disables auto-push to prevent conflicts with Drizzle-managed planner tables, but this requires manual migration coordination.
- Files: `apps/web/payload.config.ts` (line 49)
- Impact: Risk of schema drift if Payload migrations aren't manually run. No automation to sync Payload and Drizzle schemas during development.
- Fix approach: Document required migration order. Consider separate database schemas for Payload (public) vs Planner (internal). Implement pre-deployment validation.

**Large Component Files Lack Code Splitting:**
- Issue: Multiple UI components exceed 600+ lines (guide-result.tsx: 714 lines, plan-result.tsx: 687 lines, planner-form.tsx: 623 lines).
- Files: `apps/web/components/channel-guide/guide-result.tsx`, `apps/web/components/marketing-plan/plan-result.tsx`, `apps/web/components/yearly-planner/planner-form.tsx`
- Impact: Difficult to test, maintain, and reuse. Complex state management within single components. Slow bundle size impact.
- Fix approach: Extract quiz logic, form sections, and result rendering into separate sub-components. Move shared state to custom hooks.

**Environment Configuration Scattered Across Files:**
- Issue: No centralized env validation. Fallback values like `"development-secret"` and default port `3000` embedded in code.
- Files: `apps/web/payload.config.ts`, `apps/web/lib/planner/trpc.ts`
- Impact: Easy to miss required env vars during deployment. Insecure fallbacks in production.
- Fix approach: Create `apps/web/src/lib/env.ts` with Zod schema for all env vars. Throw on missing critical vars. Add `.env.example` to repo root.

**No Error Boundary for Stripe Webhook Handler:**
- Issue: Webhook endpoint catches errors but returns generic messages. Product lookup failures don't distinguish between "product not found" vs "Stripe API error".
- Files: `apps/web/app/api/webhooks/stripe/route.ts`
- Impact: Silent payment failures if Stripe Price ID doesn't match any product. Orders may be created even if line items aren't found.
- Fix approach: Implement structured logging. Return specific error codes for different failure modes. Add retryable vs non-retryable error handling.

**User ID Coercion Without Validation:**
- Issue: Webhook handler uses `Number.parseInt(userId, 10)` on untrusted session metadata without checking if result is valid number.
- Files: `apps/web/app/api/webhooks/stripe/route.ts` (line 92)
- Impact: Invalid userId creates orders for user ID `NaN`. Database constraints may prevent this, but represents a gap in input validation.
- Fix approach: Validate userId is numeric and > 0 before use. Consider using Zod for session metadata schema validation.

## Known Bugs

**Stripe Price ID Lookup Race Condition:**
- Symptoms: Webhook handler creates orders successfully but Stripe Price ID may not exist in products table if creation hasn't completed.
- Files: `apps/web/app/api/webhooks/stripe/route.ts` (line 58-66)
- Trigger: Product created in Payload, Stripe plugin syncs it, webhook arrives before afterChange hook completes stripePriceId assignment.
- Workaround: Retry failed webhooks manually or add exponential backoff in webhook handler.

**Console Logs in Production Webhook Handler:**
- Symptoms: Sensitive information (error messages, user IDs) logged to stdout in production webhook.
- Files: `apps/web/app/api/webhooks/stripe/route.ts` (lines 9, 23, 35, 84, 106, 108)
- Trigger: Any webhook event triggers console.error calls visible in logs.
- Workaround: Use structured logging instead of console. None currently prevents this.

## Security Considerations

**Exposed Database Connection String in .env File:**
- Risk: DATABASE_URI committed to repo (masked here but actual credentials visible in git history).
- Files: `.env`
- Current mitigation: .env is in .gitignore, but Neon connection string is still human-readable.
- Recommendations: Rotate Neon password immediately. Use .env.local for local development. Implement .env encryption or use separate deployment secrets manager.

**Insufficient CORS/Origin Validation for Stripe Webhook:**
- Risk: Webhook endpoint doesn't validate request origin, only Stripe signature. If signature verification fails, returns generic 400.
- Files: `apps/web/app/api/webhooks/stripe/route.ts`
- Current mitigation: Stripe webhook signature validation prevents tampering.
- Recommendations: Add request origin validation. Log failed signature attempts for monitoring.

**Admin Role Access Not Fully Defined:**
- Risk: Payload auth checks for `user.role === "admin"` but admin capabilities in Orders, Products, and other collections are implicitly granted.
- Files: `apps/web/src/collections/orders.ts` (line 14)
- Current mitigation: Order access control uses relationship check for non-admins.
- Recommendations: Document explicit admin capabilities per collection. Add role-based field-level access control.

**AI Router Exposes System Prompts in Error Messages:**
- Risk: System prompts designed to guide AI behavior could be extracted via error inspection.
- Files: `packages/planner-api/routers/ai.ts`
- Current mitigation: Prompts are server-side only, but detailed error responses could leak prompt structure.
- Recommendations: Sanitize AI error messages. Log full errors server-side, return generic client-side messages.

## Performance Bottlenecks

**Synchronous Stripe Price Creation in AfterChange Hook:**
- Problem: Product afterChange hook calls Stripe API synchronously, blocking request completion.
- Files: `apps/web/src/collections/products.ts` (line 41-59)
- Cause: Hook waits for `stripe.prices.create()` to complete before returning.
- Improvement path: Move to async job queue (Bull, Bullmq, or similar). Return immediately, create price in background. Retry on failure.

**Promise.all() for Line Item Processing in Checkout:**
- Problem: All product lookups hit database in parallel but no connection pooling configured.
- Files: `apps/web/app/api/checkout/route.ts` (line 30-50)
- Cause: Could overwhelm database on high checkout volume. Payload doesn't have documented connection limits.
- Improvement path: Implement rate limiting. Add batch loading for product lookups. Cache active product list in Redis.

**No Database Query Optimization in Workspace Router:**
- Problem: Workspace queries use N+1 pattern. Fetching workspace with members requires separate queries per endpoint.
- Files: `packages/planner-api/routers/workspace.ts`
- Cause: Drizzle relations are defined but not consistently used in queries.
- Improvement path: Add Drizzle with() relation loading. Create workspace query helper with eager-loaded members, invitations, and subscription.

**Large Migration Files Not Indexed:**
- Problem: Migration files (1010 and 557 lines) are loaded entirely on startup.
- Files: `apps/web/src/migrations/20260117_230853.ts`, `apps/web/src/migrations/20260110_113243_initial.ts`
- Cause: Complex schema with many enums and tables defined in single migration.
- Improvement path: Break into smaller migrations per feature. Document migration dependencies.

## Fragile Areas

**Stripe Plugin Configuration Depends on Env Vars:**
- Files: `apps/web/payload.config.ts` (lines 80-89, 156-159)
- Why fragile: Stripe feature silently disables if `BLOB_READ_WRITE_TOKEN` or `STRIPE_SECRET_KEY` missing. No error thrown.
- Safe modification: Add validation that throws if Stripe env vars are missing in production. Add feature flags for optional integrations.
- Test coverage: No tests for webhook flow or Stripe sync hooks.

**Zustand Cart Store Relies on localStorage:**
- Files: `packages/cart/index.ts`
- Why fragile: `persist` middleware uses browser localStorage without hydration safety checks. Server-rendered React may hydrate cart before localStorage available.
- Safe modification: Wrap cart usage in `useEffect` with client-only flag. Test hydration edge cases.
- Test coverage: No tests for cart persistence or browser compatibility.

**Payload Type Generation Not Automated:**
- Files: `apps/web/payload-types.ts`
- Why fragile: Generated from Payload config but `generate:types` script must be run manually. Easy to have stale types.
- Safe modification: Add pre-commit hook to regenerate types. Fail build if types are out of sync.
- Test coverage: No tests for type generation.

**Workspace Access Control Helpers Could Be Bypassed:**
- Files: `packages/planner-api/routers/workspace.ts` (checkWorkspaceAccess function)
- Why fragile: Access control implemented as helper function, not middleware. Easy to accidentally call procedure without checking.
- Safe modification: Create protected procedure wrapper that enforces workspace check. Make checkWorkspaceAccess required parameter.
- Test coverage: Minimal test coverage for RBAC logic.

## Scaling Limits

**Database Connection Pool Not Configured:**
- Current capacity: Neon pooler default (assumed 1 connection per app instance).
- Limit: Under high load, connection exhaustion will cause "too many clients" errors.
- Scaling path: Increase Neon pool size. Use connection pooling proxy (pgBouncer). Migrate to serverless-friendly connection pooling.

**Webhook Handler Not Idempotent:**
- Current capacity: Single webhook endpoint processes all Stripe events.
- Limit: Duplicate webhook deliveries create duplicate orders. No idempotency key handling.
- Scaling path: Add idempotency key storage (Redis or database). Check idempotency_key header from Stripe.

**Planner AI Router Makes Unbounded API Calls:**
- Current capacity: generateText() calls OpenAI without token limits or rate limiting.
- Limit: Single user could exhaust all API quota by submitting many requests.
- Scaling path: Implement per-user rate limits (e.g., 10 plans/day). Add token budgets per subscription tier. Cache similar requests.

## Dependencies at Risk

**React Compiler Babel Plugin in Early Stages:**
- Risk: `babel-plugin-react-compiler` v1.0.0 is new. May have breaking changes in minor versions.
- Impact: Component builds could fail after dependency update if plugin API changes.
- Migration plan: Pin to exact version. Monitor React Compiler releases. Have plan to remove if deprecated.

**Payload CMS 3.70 Plugin Stripe Sync:**
- Risk: Stripe plugin automatically syncs products. If it breaks, manual Stripe syncing required.
- Impact: New products won't have Stripe IDs. Checkout will fail silently.
- Migration plan: Document manual Stripe sync process. Implement fallback that creates Stripe products on-demand if missing.

**Drizzle ORM Migrations in Separate Package:**
- Risk: Planner database schema lives in separate package (`planner-db`). Changes require coordination.
- Impact: Schema drift if planner-db migrations not run after package update.
- Migration plan: Include migration check in startup. Document required migration order relative to Payload migrations.

## Missing Critical Features

**No Idempotent Webhook Processing:**
- Problem: Stripe can deliver same webhook multiple times. No deduplication.
- Blocks: Reliable payment processing at scale.

**No Retry Mechanism for Failed Orders:**
- Problem: If order creation fails during webhook, no automatic retry.
- Blocks: Payment confirmation emails won't be sent. Orders lost.

**No Audit Logging:**
- Problem: No record of who accessed what data, when orders were created, who modified products.
- Blocks: Fraud detection, compliance, debugging production issues.

**No Rate Limiting on APIs:**
- Problem: tRPC endpoints and REST API lack rate limiting.
- Blocks: DDoS protection, preventing abuse of AI generation endpoints.

## Test Coverage Gaps

**Stripe Webhook Handling Untested:**
- What's not tested: Webhook signature validation, order creation flow, line item matching, email sending.
- Files: `apps/web/app/api/webhooks/stripe/route.ts`
- Risk: Payment flow breaks silently. Webhook could create malformed orders.
- Priority: High

**Workspace Access Control Untested:**
- What's not tested: User role enforcement, member addition/removal, invitation flow, permission boundaries.
- Files: `packages/planner-api/routers/workspace.ts`, access control helpers
- Risk: Users could access workspaces they don't belong to or perform admin actions without permission.
- Priority: High

**AI Generation Input Validation Untested:**
- What's not tested: Request validation, prompt injection prevention, output parsing.
- Files: `packages/planner-api/routers/ai.ts`
- Risk: Invalid or malicious input could cause AI to behave unexpectedly or expose system prompts.
- Priority: Medium

**Cart State Persistence Untested:**
- What's not tested: localStorage hydration, cart updates, total calculation, edge cases (empty cart, max items).
- Files: `packages/cart/index.ts`
- Risk: Cart could show inconsistent state or total incorrectly calculated.
- Priority: Low

---

*Concerns audit: 2026-02-03*
