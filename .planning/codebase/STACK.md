# Technology Stack

**Analysis Date:** 2026-02-03

## Languages

**Primary:**
- TypeScript 5.3.3+ - Full application codebase, strict type checking
- JavaScript - Configuration files (ESM modules)

**Secondary:**
- SQL - PostgreSQL database schemas (Payload CMS + Drizzle ORM)

## Runtime

**Environment:**
- Node.js - Runtime for Next.js, Payload CMS, and tRPC APIs
- Bun 1.2.0 - Package manager and task runner
- Browser - React 19 client-side rendering

**Package Manager:**
- Bun 1.2.0 - Primary package manager with faster install/runtime
- Lockfile: `bun.lockb` (Bun native format)

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework with App Router
- React 19.2.3 - UI library with latest React features
- Payload CMS 3.70.0 - Headless CMS with PostgreSQL database
- Turborepo (latest) - Monorepo orchestration and build caching

**API & Backend:**
- tRPC 11.0.0 - End-to-end type-safe API layer
- Next.js API Routes - Serverless endpoints for webhooks and checkout
- Drizzle ORM 0.38.3 - Type-safe database queries for Planner package

**State Management:**
- Zustand 5.0.9 - Lightweight client-side cart state in `@poynt/cart`
- React Hook Form 7.69.0 - Form state management
- React Query (@tanstack/react-query) 5.60.0 - Server state and caching

**UI & Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- Radix UI - Unstyled accessible component primitives
- Framer Motion 12.29.2 - Animation library
- Lucide React 0.562.0 - Icon library

**Auth & Security:**
- Better Auth 1.2.5 - Authentication framework in `@poynt/planner-auth`
- @better-fetch/fetch 1.1.12 - Fetch wrapper for auth
- Zod 4.3.6 - Schema validation and type inference

**AI & LLM:**
- ai 6.0.5 - Vercel AI SDK for generative AI
- @ai-sdk/openai 3.0.2+ - OpenAI integration for GPT-4o-mini
- @ai-sdk/gateway 3.0.30 - Gateway for AI provider routing

**Testing & Quality:**
- Biome 1.9.4 - Formatter and linter (JavaScript, JSON, Markdown)
- TypeScript tsc - Type checking with strict mode

**Build & Dev:**
- Next.js Build System - Optimized production builds
- Babel 7.27+ - JavaScript transpilation
- Sharp 0.34.5 - Image optimization for Payload CMS

**CMS Plugins:**
- @payloadcms/plugin-stripe 3.70.0 - Stripe integration and product sync
- @payloadcms/plugin-seo 3.70.0 - SEO metadata management
- @payloadcms/plugin-redirects 3.70.0 - URL redirect management
- @payloadcms/plugin-form-builder 3.70.0 - Dynamic form builder
- @payloadcms/richtext-lexical 3.70.0 - Lexical rich text editor

**Storage:**
- @payloadcms/storage-vercel-blob 3.70.0 - CDN file storage for media
- Vercel Blob - Cloud file storage backend

**Database:**
- @payloadcms/db-postgres 3.70.0 - PostgreSQL adapter for Payload CMS
- postgres 3.4.5 - PostgreSQL client library for Drizzle
- drizzle-kit 0.30.1 - Schema generation and migrations

## Configuration

**Environment:**
- `.env.local` - Development environment variables (git-ignored)
- `biome.json` - Formatter and linter configuration (2-space indent, 80 char line width)
- `turbo.json` - Turborepo task definitions and build caching
- `tsconfig.json` - TypeScript compiler options per workspace
- `next.config.mjs` - Next.js configuration (Payload integration, image optimization)
- `payload.config.ts` - Payload CMS configuration with plugins and collections

**Key Configurations:**
- **Path Aliases:** `@/*` points to workspace root, `@payload-config` points to payload.config.ts
- **Next.js Image Optimization:** Disabled in development (`unoptimized: true`), enabled in production
- **Image Remotes:** `*.public.blob.vercel-storage.com` for Vercel Blob CDN
- **Biome Rules:** `noExplicitAny: warn`, `noNonNullAssertion: warn`, `organizeImports: enabled`
- **Turbo Tasks:** `build`, `typecheck`, `lint`, `dev` (no cache), `clean`

## Platform Requirements

**Development:**
- Bun 1.2.0+ (or Node.js 18+ with npm/yarn as fallback)
- PostgreSQL 12+ (or Neon PostgreSQL compatible)
- OpenAI API key for AI features
- Stripe API keys for payment processing
- Resend API key for email delivery

**Production:**
- Deployment target: Vercel (Next.js native) or any Node.js hosting
- PostgreSQL database (managed service like Neon, AWS RDS, DigitalOcean)
- Environment variables: `STRIPE_SECRET_KEY`, `PAYLOAD_SECRET`, `DATABASE_URI`, `OPENAI_API_KEY`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`
- Vercel Blob token for CDN storage (optional, falls back to local storage)

---

*Stack analysis: 2026-02-03*
