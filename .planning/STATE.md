# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-03)

**Core value:** Marketers get practical, actionable help — editorial content to learn from and AI tools that give personalized marketing advice based on their business context.
**Current focus:** Phase 1 - Auth Unification & Membership Foundation

## Current Position

Phase: 1 of 6 (Auth Unification & Membership Foundation)
Plan: 1 of 3 in current phase
Status: In progress
Last activity: 2026-02-04 — Completed 01-01-PLAN.md (Schema & Auth Foundation)

Progress: [█░░░░░░░░░] 5.6%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 8 min
- Total execution time: 0.13 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 1 | 1/3 | 8 min | 8 min |

**Recent Trend:**
- Last 5 plans: 01-01 (8 min)
- Trend: Baseline

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

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 critical path:**
- ✓ Email mismatch between systems — RESOLVED in 01-01: canonical email normalization implemented, ready for account linking in 01-02
- Password hashing compatibility between Payload and Better Auth needs validation during Phase 1 implementation (email+password now disabled in Better Auth, so compatibility is moot)

**Phase 2 validation needed:**
- Stripe subscription interval configuration with interval_count for 3/6/12 month billing
- Race condition: purchase before Better Auth account exists. Solution: just-in-time account creation in webhook
- Cart handling: membership products cannot mix with digital products in Stripe checkout. Needs separate flows

**Phase 4 locale decision:**
- Norwegian locale code: use 'nb' (Bokmål) as primary, not 'no' macrolanguage. Configure before enabling Payload localization

## Session Continuity

Last session: 2026-02-04 (Phase 1 execution)
Stopped at: Completed 01-01-PLAN.md — Schema & Auth Foundation (8 min)
Resume file: None - ready for 01-02 (Account Linking)
