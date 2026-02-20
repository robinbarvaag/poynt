# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-Learning platform with digital product sales built as a **Bun monorepo** using:
- **Next.js 16** with App Router and React 19
- **Payload CMS 3.70** with PostgreSQL
- **Stripe** for payments (synced with Payload)
- **Zustand** for client-side cart state
- **Turborepo** for build orchestration

## Commands

```bash
# Development
bun run dev              # Start all services (Turborepo)

# Build & Clean
bun run build            # Production build
bun run clean            # Clean build artifacts
bun run nuke             # Full reset (rm node_modules, reinstall)

# Code Quality
bun run check            # Biome lint + format (with fixes)
bun run check:ci         # CI-friendly Biome check (no fixes)
bun run lint             # ESLint
bun run typecheck        # TypeScript validation
bun run format           # Format with Biome

# Payload CMS (run from apps/web)
bun run generate:types   # Regenerate Payload TypeScript types
bun run payload          # Payload CLI
```

## Architecture

### Monorepo Structure

```
apps/web/                 # Main Next.js + Payload app
packages/
  cart/                   # Zustand cart store (localStorage persistence)
  email/                  # Resend email integration
  stripe/                 # Stripe SDK wrapper
  types/                  # Shared TypeScript types
  ui/                     # Radix UI components + Tailwind
tooling/
  eslint/                 # ESLint config
  tailwind/               # Tailwind config
  typescript/             # TypeScript presets
```

### Dual Data Systems

- **Payload CMS + PostgreSQL**: Content management, admin panel, product sales
  - Collections: Users (admin only), Products, Orders, Pages, Media, BlogPosts
  - Users collection is for admin/partner only — no customer data here
- **Better Auth + Drizzle**: Customer auth, membership, AI tools
  - Tables: planner_user, planner_subscription, planner_session, planner_workspace, etc.
  - Auth: Google OAuth + magic link (no email+password)
  - Drizzle config: `packages/planner-db/drizzle.config.ts` with `tablesFilter: ["planner_*"]`
  - Migrations: `drizzle-kit generate` → `bun run db:migrate` from packages/planner-db (NEVER use `push` — it tries to drop Payload types)

### Key Patterns

**Block-based pages**: `apps/web/blocks/` contains reusable page builder blocks (Hero, Content, Media, Features, etc.). New blocks must be registered in `payload.config.ts`.

**Cart constraint**: Digital products limited to 1 per item in cart. Cart state persists to localStorage as "poynt-cart".

**Stripe sync**: Products and prices automatically sync to Stripe via Payload plugin. Stripe IDs stored on Product and User documents.

## Code Style (Biome)

- Use `for...of` instead of `.forEach()` — Biome rule `noForEach`
- Avoid `any` — use proper types or `unknown`
- All buttons inside forms need explicit `type` attribute

## Important Files

- `apps/web/payload.config.ts` - CMS configuration, collections, plugins
- `apps/web/collections/` - Payload collection schemas
- `packages/cart/src/store.ts` - Zustand cart implementation
- `turbo.json` - Build task definitions and caching
- `biome.json` - Formatter/linter rules

## Localization

UI and CMS admin labels are in **Norwegian**. Maintain language consistency when adding Payload fields (e.g., "Kurstittel", "Pris (kr)", "Produktnavn").

## Roadmap

See `ROADMAP.md` for current status and future plans.
