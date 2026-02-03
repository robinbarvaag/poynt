# Poynt

## What This Is

Poynt is a combined e-commerce, community, and AI tools platform for marketers. The main site (poynt.no) is a marketing business website where customers can learn about services, read blog posts, listen to podcasts, and purchase digital products (PDFs, guides) and memberships. On Poynt is the membership portal — a community for marketers with editorial content and AI-powered marketing tools, accessed through tiered subscriptions.

## Core Value

Marketers get practical, actionable help — editorial content to learn from and AI tools that give personalized marketing advice based on their business context.

## Requirements

### Validated

- ✓ Public website with pages, blog, podcasts, services — existing (Payload CMS block builder)
- ✓ Digital product catalog with Stripe sync — existing (Products collection + Stripe plugin)
- ✓ Shopping cart with checkout flow — existing (Zustand cart + Stripe checkout)
- ✓ Order management — existing (Orders collection with Stripe payment IDs)
- ✓ Payload admin panel for content management — existing
- ✓ On Poynt app skeleton with 4 AI tools — existing (channel guide, marketing plan, decline generator, yearly planner)
- ✓ Workspace system with roles — existing (Drizzle DB + tRPC)
- ✓ Better Auth authentication for On Poynt — existing
- ✓ tRPC API layer for planner tools — existing
- ✓ Block-based page builder — existing (Hero, Content, CTA, Media, Testimonials, etc.)

### Active

- [ ] Unify On Poynt content with Payload CMS — navigation, pages, tool descriptions driven from CMS instead of hardcoded
- [ ] Two membership tiers: community-only (articles/content) and community + AI tools
- [ ] Membership billing periods: 1, 3, 6, and 12 months via Stripe
- [ ] Editorial community content managed through Payload (guides, tips, marketing how-tos)
- [ ] Purchase-to-access flow: buy membership on poynt.no → get access to On Poynt portal
- [ ] Account linking between Stripe purchase and On Poynt access (onboarding flow TBD)
- [ ] Admin prompt management: default prompts for all customers, tweakable per customer
- [ ] Admin GUI for prompt/system-prompt configuration in Payload
- [ ] User roles controlling access to different areas (community vs community + AI tools)
- [ ] Norwegian + English localization across the entire app
- [ ] Dynamic On Poynt — app name, routes, branding configurable from Payload
- [ ] Onboarding tutorial for new members (what's available, where to find things)

### Out of Scope

- Different tools per customer — future scope, needs separate planning
- User-generated content / forum features — editorial only for now
- Social login for On Poynt — deferred, email/password or account linking first
- Mobile app — web-first
- Third-party integrations beyond Stripe/OpenAI/Resend — not needed for v1

## Context

This project consolidates an existing setup where the main website runs on Payload CMS + Next.js and the membership portal lives in Notion. The developer (Robin) is building this for his partner who runs a marketing business. She manages content; he handles technical configuration and AI prompt tuning.

**Current state:**
- Main site (poynt.no) is functional with products, blog, services, podcasts
- On Poynt app skeleton exists with 4 AI tools, workspace system, and Better Auth
- Two separate auth systems: Payload auth (main site) and Better Auth (On Poynt)
- Two separate databases: Payload PostgreSQL and Drizzle ORM (planner data)
- On Poynt is entirely hardcoded — navigation, content, tool descriptions all in code
- Membership portal currently lives in Notion with simple access (in/out, no tiers)

**Key challenge:**
The two auth systems need to be reconciled. A customer buying a membership on the main site (Payload auth + Stripe) needs to end up with access in On Poynt (currently Better Auth). The onboarding flow — from purchase to first login — is not yet designed.

**Previous system:**
Robin previously built a version with its own PostgreSQL database and admin GUI with "bransjer" (industries). The industry concept already exists in the current tRPC router (`industryRouter`) and Drizzle schema. The prompt-per-customer configuration needs to be surfaced in an admin UI.

## Constraints

- **Tech stack**: Must use existing Payload CMS 3.70 + Next.js 16 + Bun monorepo setup
- **CMS admin**: Partner (non-technical) needs a friendly GUI for content management — Payload admin is the right fit
- **Language**: UI and CMS labels in Norwegian, with English localization support
- **Auth**: Must resolve dual auth system (Payload + Better Auth) before membership flow works
- **Payments**: Stripe already integrated for products — memberships must use same Stripe infrastructure
- **AI**: OpenAI API (GPT-4o-mini) via Vercel AI SDK — already configured

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Payload CMS as single source of truth for all content | Partner needs friendly admin, reduces complexity of dual systems | — Pending |
| Two membership tiers (community / community + AI tools) | Simple tiering matches current Notion setup, easy to expand later | — Pending |
| Norwegian + English localization | Target market is Norwegian but English opens up reach | — Pending |
| Resolve auth unification (Payload vs Better Auth) | Critical path — membership purchase flow depends on single auth source | — Pending |
| Editorial-only community content | Simpler than user-generated content, matches current Notion model | — Pending |

---
*Last updated: 2026-02-03 after initialization*
