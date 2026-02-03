# Codebase Structure

**Analysis Date:** 2026-02-03

## Directory Layout

```
poynt-monorepo/
├── apps/
│   └── web/                    # Main Next.js 16 + Payload CMS app
│       ├── app/                # Next.js App Router (route groups)
│       │   ├── (frontend)/     # Public website routes
│       │   ├── (on-poynt)/     # Authenticated planner/dashboard routes
│       │   ├── (payload)/      # Payload admin panel (auto-managed)
│       │   └── api/            # REST API endpoints & webhooks
│       ├── src/
│       │   ├── blocks/         # Payload block definitions (schema)
│       │   ├── collections/    # Payload collection schemas
│       │   ├── globals/        # Payload global field schemas
│       │   └── migrations/     # Payload CMS migrations
│       ├── components/         # React components for frontend & planner
│       ├── lib/                # Utility functions & constants
│       ├── public/             # Static assets
│       ├── payload.config.ts   # Payload CMS configuration
│       ├── next.config.mjs     # Next.js configuration
│       └── tsconfig.json       # TypeScript config
│
├── packages/                   # Shared workspace packages
│   ├── cart/                   # Zustand cart store + persistence
│   ├── email/                  # Resend email integration (stub)
│   ├── planner-api/            # tRPC routers for planner tools
│   ├── planner-auth/           # Better Auth configuration
│   ├── planner-db/             # Drizzle ORM schema & migrations
│   │   └── schema/             # Database schema definitions
│   ├── planner-validators/     # Zod schemas for form validation
│   ├── stripe/                 # Stripe SDK wrapper
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Radix UI components + Tailwind
│       ├── components/         # Reusable UI components
│       ├── hooks/              # Custom React hooks
│       ├── icons/              # Icon components
│       └── lib/                # UI utilities
│
├── tooling/                    # Build & dev tools configuration
│   ├── eslint/                 # ESLint shared config
│   ├── tailwind/               # Tailwind CSS shared config
│   └── typescript/             # TypeScript shared config
│
├── .planning/                  # GSD planning documents
│   └── codebase/               # Codebase analysis docs (ARCHITECTURE.md, etc.)
│
├── .plans/                     # Phase implementation plans
│
├── turbo.json                  # Turborepo orchestration config
├── package.json                # Root workspace config (Bun)
└── CLAUDE.md                   # Claude agent guidelines
```

## Directory Purposes

**`apps/web/app/(frontend)/`:**
- Purpose: Public e-learning marketplace with product listings, blog, podcasts, services
- Contains: Next.js page routes, dynamic routes with [slug], block renders
- Key files:
  - `page.tsx` - Homepage (fetches homepage global, renders blocks)
  - `produkter/page.tsx` - Product listing/filtering
  - `produkter/[slug]/page.tsx` - Product detail page
  - `blogg/page.tsx`, `post/[slug]/page.tsx` - Blog archive & articles
  - `podkast/[slug]/page.tsx` - Podcast episodes
  - `tjenester/[slug]/page.tsx` - Service detail pages
  - `[...slug]/page.tsx` - Catch-all for dynamic pages from Payload

**`apps/web/app/(on-poynt)/`:**
- Purpose: Authenticated AI-powered planner tools behind auth wall
- Contains: Workspace management, tool pages, settings
- Structure: Route group wrapper for consistent auth middleware
- Key files:
  - `on-poynt/page.tsx` - Root redirect/entry point
  - `on-poynt/innlogging/page.tsx` - Login page (Better Auth)
  - `on-poynt/registrer/page.tsx` - Registration page
  - `on-poynt/(app)/oversikt/page.tsx` - Dashboard overview
  - `on-poynt/(app)/verktoy/kanalveileder/page.tsx` - Channel guide tool
  - `on-poynt/(app)/verktoy/markedsplan/page.tsx` - Marketing plan generator
  - `on-poynt/(app)/verktoy/avslag-generator/page.tsx` - Decline generator
  - `on-poynt/(app)/verktoy/arsplanlegger/page.tsx` - Yearly planner
  - `on-poynt/(app)/innstillinger/arbeidsomrade/page.tsx` - Workspace settings
  - `on-poynt/(app)/innstillinger/medlemskap/page.tsx` - Subscription/billing

**`apps/web/app/api/`:**
- Purpose: REST API endpoints for backend operations
- Contains: Stripe checkout, webhooks, newsletter subscriptions
- Key files:
  - `api/checkout/route.ts` - POST: Validate cart items, create Stripe session
  - `api/webhooks/stripe/route.ts` - POST: Stripe payment webhooks
  - `api/newsletter/route.ts` - POST: Newsletter subscriptions (Resend)

**`apps/web/src/blocks/`:**
- Purpose: Payload CMS block schema definitions
- Pattern: Each file exports a block config object registered in `payload.config.ts`
- Files: `hero.ts`, `content.ts`, `media.ts`, `cta-section.ts`, `form.ts`, `product-archive.ts`, `podcast-archive.ts`, `services-archive.ts`, `spotify-embed.ts`, `testimonials.ts`
- Used by: `payload.config.ts` collects all blocks → registered in CMS admin
- Paired with: React components in `apps/web/components/blocks/` that render block data

**`apps/web/src/collections/`:**
- Purpose: Payload collection (multi-document) schema definitions
- Files:
  - `users.ts` - Auth collection (email/password, roles, Stripe customer ID)
  - `products.ts` - Digital products synced to Stripe (courses, PDFs, bundles)
  - `orders.ts` - Purchase records linked to users
  - `pages.ts` - Dynamic pages with block layout builder
  - `blog-posts.ts` - Blog articles with author relationships
  - `podcasts.ts` - Podcast episodes
  - `services.ts` - Service offerings
  - `course-content.ts` - Course modules/lessons
  - `categories.ts` - Product/content categorization
  - `media.ts` - File uploads (images, PDFs, audio)

**`apps/web/src/globals/`:**
- Purpose: Payload global field schemas (singleton per global)
- Files:
  - `site-settings.ts` - Global SEO, site name, branding
  - `header.ts` - Navigation menu config
  - `footer.ts` - Footer content & links
  - `homepage.ts` - Homepage layout (blocks array)
  - `blog-page.ts` - Blog listing page header/SEO
  - `podcast-page.ts` - Podcast listing page header/SEO
  - `products-page.ts` - Products listing page header/SEO
  - `services-page.ts` - Services listing page header/SEO
  - `product-settings.ts` - Global product display settings (benefits list, etc.)

**`apps/web/components/`:**
- Purpose: Reusable React components for frontend pages and planner app
- Structure:
  - `blocks/` - Components that render Payload block data (hero-block.tsx, content-block.tsx, etc.)
  - `channel-guide/` - Channel guide tool UI components
  - `decline-generator/` - Decline responder UI components
  - `marketing-plan/` - Marketing plan generator UI components
  - `yearly-planner/` - Yearly planner tool UI components
  - `workspace/` - Workspace management components
  - `planner/` - Shared planner app UI components
  - `pricing/` - Subscription tier display components
  - `subscription/` - Subscription status components
  - Root level: `header.tsx`, `footer.tsx`, `product-card.tsx`, `cart-drawer.tsx`, `add-to-cart-button.tsx`, etc.

**`apps/web/lib/`:**
- Purpose: Utility functions, constants, and helpers
- Key files:
  - `constants.ts` - App navigation, tool configurations, tier config, medal emoji configs (all in Norwegian)
  - `types.ts` - Type definitions for tools, workspaces, channels, industries
  - `motion-variants.ts` - Framer Motion animation presets
  - `media-url.ts` - Helper to construct CDN URLs for Vercel Blob storage
  - `planner/` - tRPC client setup and server-side tRPC caller factory

**`packages/cart/`:**
- Purpose: Client-side shopping cart state management
- Key file: `index.ts` - Zustand store with localStorage persistence
- Constraint: Only 1 of each digital product allowed per cart item
- Store key: "poynt-cart"
- Exports: `useCart()` hook with methods: `addItem()`, `removeItem()`, `clearCart()`, `total()`

**`packages/planner-api/`:**
- Purpose: tRPC backend procedures for planner tools
- Key files:
  - `index.ts` - Exports root router and type definitions
  - `root.ts` - Aggregates all routers into single AppRouter
  - `trpc.ts` - tRPC base configuration (publicProcedure, context factory)
  - `routers/` - Domain-specific routers:
    - `ai.ts` - AI generation procedures (channelGuide, marketingPlan, declineResponse, yearlyPlanner)
    - `workspace.ts` - Workspace CRUD operations
    - `industry.ts` - Industry data queries
    - `admin.ts` - Admin operations (industries management)
    - `workspaceProfile.ts` - User profile management
    - `toolResult.ts` - Save/retrieve tool results
    - `marketingPlanProgress.ts` - Marketing plan tracking
    - `declineFeedback.ts` - Decline generator feedback collection

**`packages/planner-db/`:**
- Purpose: Drizzle ORM schema and database migrations
- Key files:
  - `index.ts` - DB connection factory
  - `schema/index.ts` - Re-exports all schema tables
  - `schema/auth.ts` - User profiles, sessions (Better Auth tables)
  - `schema/workspace.ts` - Workspaces, members, roles, tool results, industries
  - `schema/admin.ts` - Admin configurations (prompt templates, etc.)
  - `drizzle.config.ts` - Drizzle Kit configuration (separate from Payload)

**`packages/planner-validators/`:**
- Purpose: Zod schemas for form validation and tRPC input/output types
- Contains: Request/response schemas for all AI tools
  - `channelGuideRequestSchema` - Channel guide questionnaire validation
  - `marketingPlanRequestSchema` - Marketing plan form validation
  - `declineRequestSchema` - Decline generator form validation
  - `yearlyPlannerRequestSchema` - Yearly planner form validation
  - Label enums: `audienceLabels`, `budgetLabels`, `targetAudienceLabels`, etc.

**`packages/ui/`:**
- Purpose: Shared component library built on Radix UI + Tailwind
- Subdirectories:
  - `components/` - Button, Card, Dialog, Form, Input, Select, Textarea, Badge, Avatar, etc.
  - `hooks/` - Custom React hooks (useMediaQuery, useLocalStorage, etc.)
  - `icons/` - Icon component wrapper around Lucide icons
  - `lib/` - Utility functions (cn for className merging, etc.)

**`packages/types/`:**
- Purpose: Shared TypeScript type definitions
- Exports: `Product`, `Order`, `User`, `Workspace` types used across apps

**`packages/stripe/`:**
- Purpose: Stripe SDK wrapper for easy import
- Exports: `stripe` client instance, `getStripe()` function

**`packages/email/`:**
- Purpose: Email integration via Resend (not yet implemented)
- Stub: Placeholder for future implementation

**`packages/planner-auth/`:**
- Purpose: Better Auth configuration
- Handles: OAuth setup, session management for planner app

**`tooling/eslint/`, `tooling/tailwind/`, `tooling/typescript/`:**
- Purpose: Shared linting, styling, and TypeScript configurations
- Used by: All workspace packages via `workspace:*` dependency syntax

## Key File Locations

**Entry Points:**
- `apps/web/payload.config.ts` - Payload CMS root config (collections, globals, plugins)
- `apps/web/next.config.mjs` - Next.js config with Payload integration
- `apps/web/app/(frontend)/page.tsx` - Frontend homepage entry
- `apps/web/app/(on-poynt)/on-poynt/page.tsx` - Planner app entry
- `packages/planner-api/root.ts` - tRPC API root router

**Configuration:**
- `turbo.json` - Turborepo tasks, cache config, global env vars
- `package.json` (root) - Workspace definition, scripts
- `apps/web/package.json` - Next.js + Payload dependencies
- `tsconfig.json` - Root TypeScript config

**Core Logic:**
- `apps/web/src/collections/products.ts` - Product schema + Stripe sync hooks
- `apps/web/src/collections/users.ts` - User auth schema
- `apps/web/src/collections/orders.ts` - Order schema
- `packages/cart/index.ts` - Zustand cart store implementation
- `packages/planner-api/routers/ai.ts` - AI tool procedures
- `packages/planner-db/schema/workspace.ts` - Workspace data models

**Testing:**
- Test files co-located with source files (not a separate test directory)
- Pattern: `[component/file].test.ts` or `[component/file].spec.ts` (not yet widely used)

**Styling:**
- `apps/web/app/globals.css` - Global Tailwind imports
- `tooling/tailwind/` - Shared Tailwind config preset
- Component styling: Inline with `className` using Tailwind utilities

## Naming Conventions

**Files:**
- Collections: lowercase hyphenated, plural in code name but singular in slug (e.g., `blog-posts.ts` → slug: "blog-posts")
- Components: PascalCase with .tsx extension (e.g., `ProductCard.tsx`, `HeroBlock.tsx`)
- Utilities/functions: camelCase with .ts extension (e.g., `media-url.ts`, `motion-variants.ts`)
- API routes: lowercase with subdirectory structure (e.g., `api/checkout/route.ts`)
- Database schema: snake_case in drizzle definitions (e.g., `tool_results`, `workspace_members`)
- Payload globals: camelCase in config, lowercase slug (e.g., `Homepage` → slug: "homepage")

**Directories:**
- Components: PascalCase when domain-specific (e.g., `ChannelGuide/`, `Marketing Plan/`)
- Features: kebab-case (e.g., `channel-guide`, `decline-generator`, `yearly-planner`)
- Collections/schemas: kebab-case (e.g., `blog-posts`, `course-content`, `product-settings`)

**Variables/Constants:**
- Constants: UPPER_CASE for immutable config (e.g., `NEXT_PUBLIC_URL`)
- Component props: camelCase (e.g., `initialSavedResult`, `onStartQuiz`)
- State variables: camelCase (e.g., `industry`, `targetAudience`)

**Types:**
- Interfaces: PascalCase, prefix with `I` only if distinguishing from values (rarely done here)
- Generics: Uppercase single letter (T, K, V) or descriptive (e.g., `<TRouter extends Router>`)
- Enums: PascalCase (e.g., `ChannelRecommendation`, but mostly using Zod for runtime validation instead)

## Where to Add New Code

**New E-Learning Feature (e.g., New Product Type):**
- Add collection in `apps/web/src/collections/` (e.g., `interactive-courses.ts`)
- Register in `apps/web/payload.config.ts` under `collections` array
- Create component in `apps/web/components/` (e.g., `InteractiveCourseCard.tsx`)
- Add route in `apps/web/app/(frontend)/interactive-courses/[slug]/page.tsx`
- Tests: Co-locate as `*.test.tsx` in `apps/web/components/`

**New Planner Tool (e.g., New AI Generator):**
- Add tRPC router in `packages/planner-api/routers/` (e.g., `content-calendar.ts`)
- Add validator schemas in `packages/planner-validators/` (e.g., `contentCalendarSchema.ts`)
- Add database schema in `packages/planner-db/schema/workspace.ts` if storing results
- Create page in `apps/web/app/(on-poynt)/on-poynt/(app)/verktoy/inholdskalender/`
- Create client component in `apps/web/components/content-calendar/`
- Register tRPC router in `packages/planner-api/root.ts`
- Update navigation in `apps/web/lib/constants.ts` (`mainNavItems`, `tools`, `quickActions`)

**New Shared Component:**
- Add to `packages/ui/components/` (e.g., `new-component.tsx`)
- Export from `packages/ui/components/index.ts` or `packages/ui/index.ts`
- Build on Radix UI primitives (button, dialog, etc.)
- Styled with Tailwind utility classes

**New Utility/Helper:**
- Shared helpers: `packages/ui/lib/` or `packages/types/`
- App-specific helpers: `apps/web/lib/`
- API helpers: `packages/planner-api/` or new package

**New Database Table (Planner):**
- Define schema in `packages/planner-db/schema/` (e.g., `schema/content.ts`)
- Add export to `packages/planner-db/schema/index.ts`
- Generate migration: `bun run -cwd packages/planner-db db:generate`
- Apply migration: `bun run -cwd packages/planner-db db:migrate` (or `db:push` for dev)
- DO NOT use Payload's auto-push (disabled in `payload.config.ts` to avoid conflicts)

**New API Endpoint:**
- tRPC: Add procedure to router in `packages/planner-api/routers/`
- REST: Create route file in `apps/web/app/api/[feature]/route.ts`
- Webhooks: Create in `apps/web/app/api/webhooks/[provider]/route.ts`

**Styling/Theme:**
- Global styles: `apps/web/app/globals.css`
- Tailwind config: `tooling/tailwind/tailwind.config.ts`
- Component styles: Inline with `className`, use `cn()` utility to merge classes
- Design tokens: Update in Tailwind config, use class names in components

## Special Directories

**`apps/web/public/`:**
- Purpose: Static assets served directly by Next.js
- Not generated, committed to repo
- Images, fonts, favicons go here

**`.planning/codebase/`:**
- Purpose: GSD codebase analysis documents
- Generated by `/gsd:map-codebase` command
- Not committed by default
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

**`.plans/`:**
- Purpose: Phase implementation plans
- Format: `.plans/YYYY-MM-DD-feature-name/` with `PLAN.md` and `task-N.md` files
- Generated by `/gsd:plan-phase` and executed by `/gsd:execute-phase`
- Example: `.plans/2026-01-10-poynt-setup/`

**`.next/`:**
- Purpose: Next.js build output
- Generated, not committed
- Dev/prod build cache and compiled code

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated by `bun install`
- Not committed, regenerated per environment

**`.turbo/`:**
- Purpose: Turborepo cache and daemon
- Generated, not committed
- Speeds up incremental builds

---

*Structure analysis: 2026-02-03*
