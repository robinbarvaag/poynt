# Roadmap: Poynt

## Overview

Transform Poynt from a digital product marketplace into a comprehensive membership platform with tiered subscriptions, editorial community content, AI marketing tools, and dual-language support. The journey unifies two separate auth systems into a coherent purchase-to-access flow, makes all content and configuration CMS-driven through Payload, and delivers a polished experience for Norwegian and English-speaking marketers.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth Unification & Membership Foundation** - Bridge Better Auth and Payload for single membership source of truth
- [ ] **Phase 2: Membership Products & Purchase Flow** - End-to-end purchase-to-access with Stripe subscriptions and onboarding
- [ ] **Phase 3: Community Content System** - Editorial content management with tier-based access control
- [ ] **Phase 4: Dual-Language Localization** - Norwegian + English support across CMS and UI
- [ ] **Phase 5: Dynamic On Poynt & Admin Tools** - CMS-driven navigation, tool descriptions, and admin member management
- [ ] **Phase 6: AI Tool Access Control & Polish** - Tier-based tool access and subscription lifecycle edge cases

## Phase Details

### Phase 1: Auth Unification & Membership Foundation
**Goal**: Establish reliable membership tier resolution by bridging Better Auth sessions to Payload user records
**Depends on**: Nothing (first phase)
**Requirements**: MEMB-02, MEMB-07, MEMB-08
**Success Criteria** (what must be TRUE):
  1. User can log in to On Poynt via Google social login or magic link email
  2. User session persists across browser sessions and multiple devices
  3. Better Auth session resolves to Payload user record with membership tier
  4. Stripe webhook creates Better Auth account and sends welcome email on membership purchase
  5. Email normalization prevents duplicate accounts (canonical email matching works)
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Schema foundation: Drizzle canonical email, Payload membership fields, email normalization, Better Auth config with Google + magic link
- [x] 01-02-PLAN.md — Webhook & membership resolution: Stripe webhook membership purchase handler, idempotency tracking, membership tier resolution utility
- [x] 01-03-PLAN.md — Session wiring & login UI: On Poynt layout enriched session, login page with Google + magic link, human verification

### Phase 2: Membership Products & Purchase Flow
**Goal**: Enable end-to-end membership purchase with configurable billing periods and post-purchase onboarding
**Depends on**: Phase 1
**Requirements**: MEMB-01, MEMB-05, MEMB-06
**Success Criteria** (what must be TRUE):
  1. User can purchase membership on poynt.no with 1, 3, 6, or 12 month billing periods via Stripe
  2. User receives welcome email with On Poynt access link after successful payment
  3. New member completes onboarding flow showing available features and account setup
  4. User can manage subscription via Stripe Customer Portal (upgrade, downgrade, cancel, update payment)
  5. Webhook handler is idempotent (duplicate events don't create duplicate subscriptions)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD during planning
- [ ] 02-02: TBD during planning
- [ ] 02-03: TBD during planning

### Phase 3: Community Content System
**Goal**: Editorial content managed through Payload CMS with tier-based access control and member discovery
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, MEMB-03, MEMB-04
**Success Criteria** (what must be TRUE):
  1. Admin can create, edit, publish, save drafts, and schedule editorial articles in Payload with rich text and media
  2. Member can browse articles by category (e.g., "LinkedIn Tips", "TikTok", "E-post")
  3. Member can search articles by keyword with fast results
  4. Community-tier member can access all editorial content but sees AI tools locked with upgrade prompts
  5. Community + AI tier member can access both editorial content and AI tools without restrictions
  6. Article pages have responsive typography, table of contents for long articles, and embedded media
**Plans**: TBD

Plans:
- [ ] 03-01: TBD during planning
- [ ] 03-02: TBD during planning
- [ ] 03-03: TBD during planning

### Phase 4: Dual-Language Localization
**Goal**: Full Norwegian and English language support across CMS content and UI strings
**Depends on**: Phase 3
**Requirements**: I18N-01, I18N-02, I18N-03
**Success Criteria** (what must be TRUE):
  1. All CMS content (articles, tool descriptions, pages) supports Norwegian and English via Payload localization
  2. All UI strings (buttons, labels, errors, navigation) display in Norwegian and English
  3. User can switch language via header toggle and preference persists across sessions
  4. Content editors see locale-aware slug generation preventing Norwegian character collisions
  5. Date, number, and currency formatting respects user's locale preference
**Plans**: TBD

Plans:
- [ ] 04-01: TBD during planning
- [ ] 04-02: TBD during planning
- [ ] 04-03: TBD during planning

### Phase 5: Dynamic On Poynt & Admin Tools
**Goal**: Make On Poynt content CMS-driven and provide admin GUI for member and prompt management
**Depends on**: Phase 4
**Requirements**: DYNM-01, DYNM-02, ADMN-01, ADMN-02, ADMN-03, AITL-01, AITL-02
**Success Criteria** (what must be TRUE):
  1. On Poynt navigation, tool descriptions, and page content come from Payload CMS (not hardcoded)
  2. On Poynt branding (app name, logo, colors) configurable via Payload global settings
  3. Admin can view all On Poynt members in Payload admin with email, tier, Stripe status, last login
  4. Admin can change member's tier or deactivate membership from Payload admin
  5. Admin can edit default system prompts for each AI tool via Payload
  6. Admin can create per-customer prompt overrides for specific members
**Plans**: TBD

Plans:
- [ ] 05-01: TBD during planning
- [ ] 05-02: TBD during planning
- [ ] 05-03: TBD during planning
- [ ] 05-04: TBD during planning

### Phase 6: AI Tool Access Control & Polish
**Goal**: Enforce tier-based AI tool access and handle subscription lifecycle edge cases
**Depends on**: Phase 5
**Requirements**: AITL-03
**Success Criteria** (what must be TRUE):
  1. AI tools check user's membership tier before executing (premium only)
  2. Community-tier user attempting AI tool access sees clear upgrade CTA with pricing
  3. Subscription cancellation respects cancel_at_period_end (access until period end, not immediate)
  4. Expired subscriptions revoke access gracefully with grace period policy
  5. Payment failure handling includes email notifications and retry grace period
  6. Daily cron job reconciles Stripe subscriptions with local database preventing drift
**Plans**: TBD

Plans:
- [ ] 06-01: TBD during planning
- [ ] 06-02: TBD during planning

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Unification & Membership Foundation | 3/3 | ✓ Complete | 2026-02-05 |
| 2. Membership Products & Purchase Flow | 0/3 | Not started | - |
| 3. Community Content System | 0/3 | Not started | - |
| 4. Dual-Language Localization | 0/3 | Not started | - |
| 5. Dynamic On Poynt & Admin Tools | 0/4 | Not started | - |
| 6. AI Tool Access Control & Polish | 0/2 | Not started | - |
