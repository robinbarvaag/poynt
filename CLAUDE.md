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
bun run lint             # Biome lint (whole repo, single pass)
bun run typecheck        # TypeScript validation
bun run format           # Format with Biome

# Block previews (run from repo root)
bun run block-previews  # Bygg Storybook + skyt skjermbilder til blokkvelgeren i Payload

# Payload CMS (run from apps/web)
bun run generate:types   # Regenerate Payload TypeScript types
bun run payload          # Payload CLI

# Database migrations (run from repo root) — see docs/MIGRATIONS.md
bun run payload:status         # Show applied Payload migrations
bun run payload:migrate:create # Generate a Payload migration from schema changes
bun run payload:migrate        # Apply pending Payload migrations
bun run planner:generate       # Generate a Drizzle (planner_*) migration
bun run planner:migrate        # Apply Drizzle (planner_*) migrations
```

**Migrations**: Payload (`public` schema) and Better-Auth/Drizzle (`planner` schema) are
isolated into separate Postgres schemas, so each migration tool only sees its own objects.
Payload runs with `push: false` — schema changes go through committed migration files
(`payload:migrate:create` → review the generated `up()` → `payload:migrate`). Migrations remain
the source of truth for both sides; only use `drizzle-kit push` for throwaway local experiments.
Full workflow and rationale in `docs/MIGRATIONS.md`.

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
  tailwind/               # Tailwind config
  typescript/             # TypeScript presets
docs/                     # Project documentation (DESIGN, STRIPE, DRIZZLE, TESTING)
```

Linting and formatting are handled entirely by **Biome** (`biome.json` at root) — there is no ESLint in this repo.

### Dual Data Systems

- **Payload CMS + PostgreSQL**: Content management, admin panel, product sales
  - Collections: Users (admin only), Products, Orders, Pages, Media, BlogPosts
  - Users collection is for admin/partner only — no customer data here
- **Better Auth + Drizzle**: Customer auth, membership, AI tools
  - Lives in its own `planner` **Postgres schema** (`pgSchema("planner")` in `packages/planner-db/schema/_schema.ts`), physically isolated from Payload's `public` schema
  - Tables: planner_user, planner_subscription, planner_session, planner_workspace, etc.
  - Auth: Google OAuth + magic link (no email+password)
  - Drizzle config: `packages/planner-db/drizzle.config.ts` with `schemaFilter: ["planner"]` — drizzle-kit can't see Payload's `public` objects, so cross-schema collisions are impossible
  - Migrations: `drizzle-kit generate` → `bun run db:migrate` from packages/planner-db (prefer over `push`; the generated `0000_*.sql` needs `CREATE SCHEMA IF NOT EXISTS "planner";` prepended — see `docs/MIGRATIONS.md`)

### Key Patterns

**Block-based pages**: `apps/web/blocks/` contains reusable page builder blocks (Hero, Content, Media, Features, etc.). New blocks must be registered in `payload.config.ts`.

**Block previews**: blokkvelgeren («Legg til blokk») viser et Storybook-skjermbilde per blokk. Mappingen blokk-slug → story ligger i `apps/web/blocks/block-previews.ts`; bildene genereres av `bun run block-previews` og committes til `apps/web/public/block-previews/`. Ny blokk med story → legg til i mappingen og kjør kommandoen.

**Media-opplasting**: Vercel Blob med `clientUploads: true` (fila går nettleser → Blob, utenom Vercels 4,5 MB-grense). Maksstørrelse i `apps/web/lib/media-limits.ts`. Originalen lagres urørt; `imageSizes.large` (webp, maks 2400 px) er leveringskilden `<PayloadImage>` foretrekker. Nye imageSizes krever Payload-migrasjon + `scripts/regenerate-media-sizes.ts` for eksisterende bilder.

**MCP-server for Claude**: `POST /api/mcp/<MCP_SECRET>` lar Claude (claude.ai-connector, Claude Code) lage sider, kundehistorier og blogginnlegg som **utkast** via Payloads lokale API. Blokk-skjemaene genereres fra `blocks/` automatisk; richText sendes som markdown. Kode i `apps/web/lib/mcp/`, oppsett i `docs/MCP.md`.

**Lenker i rik tekst**: Lexical-lenker har typene nettadresse, side på nettstedet, forsiden, e-post og telefon (`apps/web/lib/lexical/link-feature.ts`, bruk `withPoyntLinks(defaultFeatures)` i alle `lexicalEditor({ features })`). Frontend rendrer alltid via `@/components/rich-text` (eller sprer inn `linkConverters`): eksterne lenker får ny fane + ikon, e-post/telefon får popover med «send/ring» og «kopier». Lenkelogikken ligger i `lib/lexical/link-fields.ts` (testet).

**Markdown for AI-agenter / llms.txt**: Alle offentlige sider kan hentes som markdown via `/<sti>.md` (forsiden `/index.md`), `?format=md` eller `Accept: text/markdown`. `proxy.ts` rewriter til `app/api/md/[[...path]]`; konverteringen (`lib/markdown/`) er skjemadrevet fra blokk-definisjonene, så nye blokker får markdown automatisk. `/llms.txt` og `/llms-full.txt` bygges fra samme data. Organisasjons-JSON-LD henter bedriftsfakta fra «Bedrift»-fanen i Nettsted-innstillinger (`lib/structured-data.ts`).

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
