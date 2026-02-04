# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Marketers get practical, actionable help — editorial content to learn from and AI tools that give personalized marketing advice based on their business context.
**Current focus:** Phase 1 - Auth Unification & Membership Foundation

## Current Position

Phase: 1 of 6 (Auth Unification & Membership Foundation)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-02-04 — Completed 01-02-PLAN.md (Stripe Webhook & Membership Resolution)

Progress: [██░░░░░░░░] 11.1%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~12 min
- Total execution time: ~0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 2/3 | ~23 min | ~12 min |

**Recent Trend:**
- Last 5 plans: 01-01 (8 min), 01-02 (~15 min)
- Trend: Consistent

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Auth strategy: Better Auth stays for On Poynt member authentication (social login, magic links), Payload CMS becomes single source of truth for membership tier and status
- Data boundaries: Payload owns content/membership, Drizzle owns workspace/tool data
- Localization approach: Payload native localization for CMS content, manual i18n dictionary for hardcoded UI strings
- Subscription ownership: Per-user subscriptions (not per-workspace) for v1 simplicity
- Email normalization: Manual implementation for transparency (zero dependencies) - handles Gmail dots, plus-tags, case differences (01-01)
- Email+password disabled: Members use Google OAuth or magic link only for Better Auth authentication (01-01)
- Session persistence: 30-day session expiry with 1-hour cookie cache for performance (01-01)
- Webhook idempotency: Track processed events in planner_webhook_event table (01-02)
- Membership resolution: Query Payload per-request, no caching in Phase 1 (01-02)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 critical path:**
- ✓ Email mismatch between systems — RESOLVED in 01-01: canonical email normalization implemented
- ✓ Account linking logic — RESOLVED in 01-02: webhook creates linked Better Auth + Payload users
- ✓ Membership tier resolution — RESOLVED in 01-02: getSessionWithMembership() utility available

**Phase 2 validation needed:**
- Stripe subscription interval configuration with interval_count for 3/6/12 month billing
- Cart handling: membership products cannot mix with digital products in Stripe checkout. Needs separate flows

**Phase 4 locale decision:**
- Norwegian locale code: use 'nb' (Bokmål) as primary, not 'no' macrolanguage. Configure before enabling Payload localization

## Session Continuity

Last session: 2026-02-04 (Phase 1 execution)
Stopped at: Completed 01-02-PLAN.md — Stripe Webhook & Membership Resolution (~15 min)
Resume file: None - ready for 01-03 (Middleware Protection)
