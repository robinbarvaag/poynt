# Project Research Summary

**Project:** Poynt Platform - Membership + Community + Localization Enhancement
**Domain:** E-learning platform with membership portal, digital products, and AI marketing tools
**Researched:** 2026-02-03
**Confidence:** HIGH

## Executive Summary

The Poynt platform requires a strategic transformation to add **tiered membership subscriptions** (community-only vs community + AI tools), **editorial community content**, **Norwegian/English dual-language support**, and **admin-configurable AI prompts**. This research reveals that the core challenge is not technical complexity but **architectural unification** — specifically reconciling two separate auth systems (Payload CMS auth for the main site, Better Auth for the On Poynt portal) into a coherent membership access control system.

The recommended approach leverages **Payload CMS 3.70 as the single source of truth** for all content, membership status, and configuration. Payload's native localization feature eliminates the need for external i18n libraries for CMS content, while its built-in access control provides robust tier-based content gating. The existing Stripe integration extends naturally to recurring subscriptions with webhook-driven membership status updates. Better Auth remains for On Poynt session management but bridges to Payload user records via email matching and Stripe customer ID linking.

The critical path starts with **auth unification** (Phase 1), as all downstream features depend on reliable membership tier resolution. The main risks are email mismatch between systems, Stripe subscription interval configuration (3/6/12 month billing requires careful price setup), and webhook idempotency to prevent duplicate subscriptions. Mitigation strategies include canonical email normalization, just-in-time account creation on purchase, and explicit account linking UI during onboarding.

## Key Findings

### Recommended Stack

**No new dependencies required.** The existing stack (Payload CMS 3.70, Next.js 16, Stripe, Better Auth, Drizzle ORM, PostgreSQL) supports all requirements. The key finding is that **Payload 3.70's native localization** eliminates the need for next-intl, react-i18next, or similar libraries for CMS content. The challenge is not technology selection but **system integration strategy** — specifically how to unify dual auth and dual database systems.

**Core technologies:**
- **Payload CMS 3.70**: Content management, membership product catalog, community editorial content, AI prompt templates, Norwegian/English localization (built-in `localized: true` field config)
- **Stripe Subscriptions**: Recurring billing for memberships with multiple billing periods (1/3/6/12 months via `interval_count`), webhook-driven status updates, Customer Portal for self-service billing
- **Better Auth + Payload Auth Bridge**: Better Auth manages On Poynt sessions; bridge layer links to Payload users via email matching for membership tier resolution
- **Drizzle ORM**: Continues managing workspace data, tool results, and workspace-specific configurations (no migration to Payload needed)
- **Next.js 16 Middleware**: Locale detection, membership tier access control, session validation across route groups

**Critical architecture decisions:**
1. **Auth strategy**: Payload as canonical user source, Better Auth sessions bridge via email
2. **Data boundaries**: Payload owns content/membership, Drizzle owns workspace/tool data
3. **Localization approach**: Payload native localization for CMS, manual i18n for hardcoded UI strings
4. **Subscription ownership model**: Per-user subscriptions (not per-workspace) for v1 simplicity

### Expected Features

**Must have (table stakes):**
- **Tiered membership access** — Community-only tier accesses editorial content; Community + AI tier accesses editorial + AI tools
- **Subscription management** — Self-service via Stripe Customer Portal (upgrade, downgrade, cancel, billing history, payment method updates)
- **Onboarding flow** — Post-purchase redirect to On Poynt onboarding with account linking (auto-login if Better Auth account exists, else create account)
- **Content discovery** — Navigation, search, filtering, and categories for community content managed in Payload CMS
- **Editorial content management** — Payload collection with rich text, drafts, versioning, localization, and tier-based access control
- **Prompt configuration system** — Admin-editable AI prompts in Payload (default prompts + optional per-customer overrides)
- **Norwegian + English support** — Payload localization for all CMS content, manual translation dictionary for UI strings, locale switcher in header

**Should have (competitive):**
- **Contextual AI recommendations** — AI tools reference user's industry, workspace data, and previous tool outputs for personalized advice
- **Norwegian marketing expertise** — System prompts encode knowledge of Norwegian platforms (Finn.no, VG), cultural tone, and local compliance (GDPR, Markedsføringsloven)
- **Integrated workflow** — Tool chaining where output of one tool (e.g., marketing plan) feeds into another (e.g., yearly planner)
- **Partner-curated editorial + AI synergy** — Articles link to relevant AI tools; AI tool results suggest related guides

**Defer (v2+):**
- User-generated content / forums (moderation overhead)
- Social login (Google, Facebook, LinkedIn) — auth unification already complex
- Mobile native app (responsive web sufficient)
- Third-party integrations (CRM, analytics, social scheduling)
- Custom AI models per customer (shared prompts with overrides sufficient for v1)

### Architecture Approach

The architecture follows a **unified CMS, bridged auth** pattern where Payload CMS becomes the authoritative source for all membership, content, and configuration data, while Better Auth continues handling On Poynt session management but delegates authorization decisions to Payload user records. This avoids a full auth system rewrite (high risk) while achieving single-source-of-truth for membership status.

**Major components:**

1. **Payload CMS Backend** — Manages Users collection (with new fields: `membershipTier`, `membershipStatus`, `membershipPeriodEnd`, `locale`), new Memberships collection (product catalog with Stripe price IDs), new CommunityContent collection (localized editorial articles with tier-based access), new PromptTemplates collection (AI system prompts by tool + locale), and new OnPoyntSettings global (navigation, tool descriptions, onboarding tutorial content — all localized)

2. **Auth Bridge Layer** (`lib/auth-bridge.ts`) — Helper functions that link Better Auth sessions to Payload users via email matching, check membership tier for access control, and resolve user locale preference. Used by tRPC context middleware and On Poynt layout components to enforce tier-based access.

3. **Stripe Integration Extension** — Webhook handler extended to process `customer.subscription.created/updated/deleted` events, updating Payload Users collection with membership tier and expiration date. Membership products in Payload sync to Stripe subscription prices with configurable billing intervals.

4. **On Poynt Portal Frontend** — Better Auth login flow remains unchanged; layouts and middleware query auth bridge to resolve Payload user and enforce tier-based routing. Community content fetched from Payload CMS via server components. Navigation and tool descriptions driven from OnPoyntSettings global instead of hardcoded constants.

5. **Dual Database Coordination** — Payload manages PostgreSQL schema for CMS collections via `@payloadcms/db-postgres` adapter. Drizzle manages separate set of tables (prefixed `planner_*`) for workspace, tool results, and workspace-specific data. No foreign keys between systems; application-level joins via email or Stripe customer ID.

### Critical Pitfalls

1. **Email mismatch between auth systems** — User purchases membership with `user@example.com` in Payload but signs up for On Poynt with `user+alias@example.com`. Systems fail to link accounts. **Prevention:** Canonical email normalization (strip aliases, lowercase), use Stripe checkout email as source of truth, build explicit "Link Account" UI flow during onboarding. Identified as Phase 1 blocker.

2. **Stripe subscription interval misconfiguration** — Requirement specifies 1/3/6/12 month billing periods but naive Stripe setup creates monthly prices. Users charged monthly instead of quarterly/semi-annually. **Prevention:** Create Stripe prices with `recurring: { interval: 'month', interval_count: 3 }` for 3-month option. Validate interval_count in webhook handlers. Add `subscriptionInterval` and `subscriptionIntervalCount` fields to Payload Memberships collection.

3. **Race condition: purchase before account exists** — User completes Stripe checkout but hasn't created On Poynt Better Auth account yet. Webhook fires, tries to grant access, but target user doesn't exist. **Prevention:** Just-in-time account creation in webhook handler (passwordless, send welcome email with set-password link). Store pending grants in database if user doesn't exist, apply on first login. Onboarding flow checks for pending grants via Stripe session ID in URL.

4. **Payload localization API constraints** — Payload 3.70 has different localization API than v2. Rich text fields may need custom configuration for Lexical editor locale support. Relationship fields don't auto-translate. **Prevention:** Test localization with simple text field first before enabling site-wide. Read Payload 3.70 docs (not v2 tutorials). Define fallback locale strategy upfront (show Norwegian if English missing vs show empty).

5. **Dual-database transaction consistency** — Webhook must atomically create Payload Order + Drizzle subscription + update Drizzle user. If one fails, others might succeed, leaving inconsistent state. **Prevention:** Use Stripe `event.id` as idempotency key. Implement two-phase commit simulation (create records with `status: 'pending'`, update to `active` if both succeed). Build hourly reconciliation job to sync Stripe subscriptions with local database.

## Implications for Roadmap

Based on research, suggested phase structure follows a **foundation-first, iterative enhancement** approach:

### Phase 1: Auth Unification & Membership Foundation
**Rationale:** All downstream features depend on reliable membership tier resolution. Auth bridge must work before membership products can grant access to On Poynt.

**Delivers:**
- Extended Payload Users collection with `membershipTier`, `membershipStatus`, `membershipPeriodEnd`, `locale` fields
- New Memberships collection with Stripe subscription price sync
- Auth bridge helper (`lib/auth-bridge.ts`) linking Better Auth sessions to Payload users
- Updated tRPC context with `payloadUser` and `membershipTier`
- Stripe webhook handler extended to process subscription events and update membership status

**Addresses features:**
- Tiered membership access (#1)
- Session management (#5)

**Avoids pitfalls:**
- Email mismatch between systems (1.1) via canonical normalization
- Stripe customer ID duplication (2.4) via single source of truth decision
- Password hashing incompatibility (1.3) via auth strategy decision
- Schema migration conflicts (4.1) via documented process

**Research flags:** Standard patterns, skip deep research. Stripe subscription API well-documented.

**Estimated effort:** 2-3 days

---

### Phase 2: Membership Products & Purchase Flow
**Rationale:** Once auth bridge works, implement end-to-end purchase-to-access flow. This validates the core business model before investing in content.

**Delivers:**
- Membership products created in Payload with configurable billing periods (1/3/6/12 months)
- Stripe subscription prices synced for each membership tier + billing period combination
- Idempotent webhook handler for subscription lifecycle events
- Post-purchase onboarding flow with account linking
- Welcome email with On Poynt access link

**Addresses features:**
- Subscription management (#2) via Stripe Customer Portal integration
- Onboarding flow (#3)
- Checkout flow for membership products

**Avoids pitfalls:**
- Subscription interval misalignment (2.2) via careful Stripe price configuration
- Race condition on purchase (1.4) via just-in-time account creation
- Webhook delivery failures (7.1) via idempotency and retry tolerance
- Mixed cart products (2.1) via separate checkout flows for memberships vs digital products

**Research flags:** Needs testing in Stripe test mode for subscription intervals. Validate webhook retry behavior.

**Estimated effort:** 3-4 days

---

### Phase 3: Community Content CMS
**Rationale:** With membership access control working, add the content that members pay for. Editorial content managed by partner without developer involvement.

**Delivers:**
- New CommunityContent collection in Payload with localization support
- New OnPoyntSettings global for navigation, tool descriptions, app branding
- Dynamic route `/on-poynt/community/[slug]` rendering CMS content
- Tier-based access control (community-only content vs community + AI content)
- Navigation driven from OnPoyntSettings instead of hardcoded constants

**Addresses features:**
- Editorial content management (#6)
- Content discovery (#4)
- Reading experience (#7)
- Tier-gated content access

**Avoids pitfalls:**
- Community content access without AI tools (5.2) via route-based access control
- Hardcoded content migration (Risk 3) via incremental migration with fallbacks
- Block localization (3.4) addressed in Phase 4

**Research flags:** Standard Payload collection patterns, skip research.

**Estimated effort:** 3-4 days

---

### Phase 4: Dual-Language Localization
**Rationale:** Localization affects all UI and content, so must be architectural decision early. But defer until after core membership flow works to reduce complexity.

**Delivers:**
- Payload localization config enabled (`locales: ['no', 'en'], defaultLocale: 'no'`)
- CommunityContent and OnPoyntSettings collections marked as localized
- Manual i18n helper (`lib/i18n.ts`) for hardcoded UI strings
- User locale field with language switcher in settings
- All server components pass locale to Payload queries and client components

**Addresses features:**
- Norwegian + English support (#12)
- Localized formatting for dates, numbers, currency

**Avoids pitfalls:**
- Payload localization API limitations (3.1) via testing with simple fields first
- Norwegian slug collisions (3.2) via locale-aware slug generation
- URL structure decisions (8.1) — recommend locale prefix (`/nb/...`, `/en/...`)
- Language switcher state management (8.2) via cookie + URL combination

**Research flags:** Needs research if Lexical editor localization proves complex. Otherwise standard Payload feature.

**Estimated effort:** 4-5 days

---

### Phase 5: Admin Prompt Management
**Rationale:** AI tools work with hardcoded prompts initially. Move to CMS-managed prompts once core features stable, allowing partner to tune AI outputs without code changes.

**Delivers:**
- New PromptTemplates collection in Payload (toolId, locale, systemPrompt, variables)
- Seeded default prompts for each tool (Norwegian + English)
- tRPC AI procedures updated to fetch prompts from database
- Template variable substitution system (`{{industry}}` → actual value)
- Prompt versioning via Payload's built-in versions feature

**Addresses features:**
- Prompt configuration system (#9)
- Tool configuration management (#11)

**Avoids pitfalls:**
- Prompt CMS vs hardcoded strings (6.1) via Payload collection with clear admin UI
- Prompt injection risks (6.2) via input sanitization and variable whitelist
- Prompt version control (6.3) via Payload versions plugin
- Template breaking changes (Risk 4) via validation hooks and "isActive" flag

**Research flags:** Standard Payload patterns, skip research.

**Estimated effort:** 3-4 days

---

### Phase 6: Polish & Edge Cases
**Rationale:** Core features complete. Address edge cases, expired subscriptions, payment failures, and subscription lifecycle management.

**Delivers:**
- Subscription cancellation with graceful access revocation (cancel_at_period_end)
- Daily cron job checking for expired subscriptions
- Payment failure handling with grace period and email notifications
- Stripe Customer Portal fully integrated in settings
- Admin dashboard showing subscription metrics and prompt usage

**Addresses features:**
- Content updates & notifications (#8)
- Complete subscription management lifecycle

**Avoids pitfalls:**
- Cancellation timing (2.3) via webhook handling for cancel_at_period_end
- Expired subscription edge cases (5.3) via grace period policy
- Payment method update flow (7.3) via Customer Portal link
- Data sync staleness (4.4) via reconciliation jobs

**Research flags:** None, edge case handling follows standard patterns.

**Estimated effort:** 2-3 days

---

### Phase Ordering Rationale

**Why auth first:** Membership tier resolution is a blocking dependency for all content access control, onboarding flow, and tool gating. Building content or localization before auth works results in rework.

**Why content before localization:** Testing content access control with single language reduces variables. Localization adds complexity (two languages to test, slug generation, fallback logic) that can be deferred until membership + content flow validated.

**Why prompts last:** AI tools function with hardcoded prompts during development. Moving to CMS-managed prompts is optimization that doesn't block core business model validation. Partner can provide prompt requirements during earlier phases.

**Dependency chain:**
- Phase 1 (Auth) → Phase 2 (Purchase) → Phase 3 (Content) → Phase 4 (Localization) → Phase 5 (Prompts) → Phase 6 (Polish)
- Localization affects Phases 3-5 but can be partially implemented (Payload config) in Phase 4 and retrofitted to earlier work
- Phases 2-3 can overlap if two developers available (one on purchase flow, one on content CMS)

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 2 (Purchase Flow):** Stripe subscription billing with multiple intervals needs API research to confirm `interval_count` behavior and pro-rating rules for mid-cycle upgrades
- **Phase 4 (Localization):** If Payload 3.70 Lexical editor localization proves complex, may need research into custom Lexical serializers or alternative rich text editor

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Auth):** Email matching and session bridging are standard patterns
- **Phase 3 (Content):** Payload collection creation follows existing Pages collection pattern
- **Phase 5 (Prompts):** Payload globals and collections well-documented
- **Phase 6 (Polish):** Stripe webhook handling and cron jobs are standard implementations

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All requirements achievable with existing dependencies. Payload 3.70 localization is native feature (verified in official docs). Stripe subscriptions well-documented. |
| Features | **HIGH** | Feature breakdown based on membership platform analysis (Circle.so, Kajabi, Memberstack). Table stakes vs differentiators clearly identified. Anti-features documented to maintain focus. |
| Architecture | **MEDIUM-HIGH** | Auth bridge pattern is sound but introduces email matching complexity (potential edge cases with aliases/typos). Dual-database coordination requires careful transaction handling. No architectural blockers, but execution risk in integration points. |
| Pitfalls | **HIGH** | Pitfalls derived from dual-auth systems, Stripe subscription billing edge cases, and Payload 3.x localization constraints. Phase mapping shows where each pitfall must be addressed. Prevention strategies actionable. |

**Overall confidence:** **HIGH**

### Gaps to Address

**Gap 1: Password hashing compatibility between Payload and Better Auth**
- **Issue:** If migrating users between systems, password hashes must be compatible (both use bcrypt by default but salt rounds may differ)
- **Resolution strategy:** Test with sample user during Phase 1. If incompatible, implement lazy migration (on first successful Payload login, create Better Auth account) or require password reset for all migrated users
- **When to resolve:** Phase 1 (Auth Unification) — migration strategy decision blocks downstream work

**Gap 2: Subscription ownership model (per-user vs per-workspace)**
- **Issue:** Drizzle schema has `planner_subscription` table with `userId` field, but unclear if subscription is per-user or per-workspace. B2B model would have workspace-level subscriptions with multiple members.
- **Resolution strategy:** Confirm with stakeholder if workspaces are individual (1 user = 1 workspace) or collaborative (1 workspace = N users). Recommendation: per-user for v1 simplicity.
- **When to resolve:** Phase 2 (Membership Products) — affects database schema and access control logic

**Gap 3: Norwegian locale code (nb vs no vs nn)**
- **Issue:** Norwegian has two written standards (Bokmål = nb, Nynorsk = nn). ISO 639-1 code is "no" (macrolanguage). Payload localization and browser Accept-Language headers may use different codes.
- **Resolution strategy:** Use "nb" (Bokmål) as primary Norwegian locale. Configure Payload with `{ code: 'nb', fallbackLocale: 'en' }`. Test Accept-Language header parsing to handle "no" → "nb" mapping.
- **When to resolve:** Phase 4 (Localization) — before enabling Payload localization config

**Gap 4: Existing digital products (PDFs, courses) vs new memberships in cart**
- **Issue:** Current cart (Zustand) handles one-time digital products. Membership subscriptions cannot mix with one-time products in same Stripe checkout session (API limitation).
- **Resolution strategy:** Split cart UI into "Digital Products" and "Memberships" sections with separate checkout buttons. Or block adding membership if cart contains products (and vice versa).
- **When to resolve:** Phase 2 (Purchase Flow) — before building membership checkout

## Sources

### Primary (HIGH confidence)
- **Payload CMS 3.70 Official Documentation** — Localization API, access control patterns, authentication, Stripe plugin, PostgreSQL adapter configuration (verified 2026-02-03)
- **Stripe API Documentation** — Subscriptions API, webhook events (customer.subscription.*), recurring price configuration with interval_count, Customer Portal
- **Existing Poynt Codebase** — Current Payload collections (Users, Products, Orders), Better Auth setup, Drizzle schema (`planner_*` tables), Stripe integration patterns

### Secondary (MEDIUM confidence)
- **Payload CMS Discord & GitHub Issues** — Community reports on Payload 3.x localization with Lexical editor, migration experiences from Payload 2.x to 3.x
- **Membership Platform Analysis** — Feature patterns from Circle.so (tier-based content gating), Kajabi (onboarding flows), Ghost (newsletter + membership hybrid), Memberstack (flexible tier configuration)
- **Next.js 16 Documentation** — Middleware for locale detection, route groups for auth-protected sections, server components with Payload integration

### Tertiary (LOW confidence, needs validation)
- **Better Auth + Payload Integration Patterns** — Community examples sparse; dual-auth pattern is custom solution requiring validation during Phase 1 implementation
- **Stripe Subscription Prorating** — Documentation covers prorating for upgrades/downgrades but edge cases (3-month to 6-month mid-cycle) need testing in Stripe test mode

---

*Research completed: 2026-02-03*
*Ready for roadmap: **yes***

---

## Handoff Notes for Roadmapper

**Critical path:** Phase 1 (Auth Unification) is the gating factor. All downstream features depend on membership tier resolution working reliably.

**Quick wins:** Phase 3 (Community Content) can deliver visible value quickly once Phase 1 complete. Partner can start creating content in Payload while Phases 4-5 in development.

**Risk areas requiring validation:**
1. Email matching robustness (Phase 1) — test with production-like email variations
2. Stripe subscription interval configuration (Phase 2) — validate with Stripe test mode before production
3. Payload Lexical localization (Phase 4) — may require custom configuration or alternative editor

**Parallelization opportunities:**
- Phases 2 and 3 can overlap (separate developers on purchase flow vs content CMS)
- Phase 5 (Prompts) can start while Phase 4 (Localization) in progress (prompts initially monolingual)

**Phase sizing:** Total estimated effort is 17-23 days sequential, or ~12-15 days with 2 developers leveraging parallelization opportunities.
