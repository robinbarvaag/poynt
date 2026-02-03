# External Integrations

**Analysis Date:** 2026-02-03

## APIs & External Services

**Payment Processing:**
- Stripe - Payment processing and subscription management
  - SDK/Client: `@poynt/stripe` (wrapper at `packages/stripe/index.ts`)
  - Stripe SDK: `stripe` 20.1.2
  - Auth: `STRIPE_SECRET_KEY` (test key: `sk_test_51QbTKP...`)
  - Webhooks: `STRIPE_WEBHOOK_SECRET` for signature verification
  - Implementation: Products synced via `@payloadcms/plugin-stripe`, checkout sessions created in `apps/web/app/api/checkout/route.ts`, webhook handler at `apps/web/app/api/webhooks/stripe/route.ts`

**Email Delivery:**
- Resend - Transactional and newsletter email service
  - SDK/Client: `@poynt/email` (wrapper at `packages/email/index.ts`)
  - Resend SDK: `resend` 6.7.0
  - Auth: `RESEND_API_KEY` (currently not configured in demo)
  - Functions: `sendOrderConfirmation()` and `subscribeToNewsletter()` called from `apps/web/app/api/newsletter/route.ts` and stripe webhook
  - Newsletter: Uses `RESEND_AUDIENCE_ID` env var for audience management

**AI & LLM:**
- OpenAI (GPT-4o-mini) - Generative AI for marketing and communication
  - SDK/Client: `@ai-sdk/openai` 3.0.2+, Vercel AI SDK (`ai` 6.0.5)
  - Auth: `OPENAI_API_KEY` (must be configured)
  - Models Used: `gpt-4o-mini` for text generation
  - Implementation: tRPC procedures in `packages/planner-api/routers/ai.ts`
    - `decline` mutation - Generates professional decline responses
    - `channelGuide` mutation - Marketing channel recommendations
    - `marketingPlan` mutation - Monthly marketing plans
    - `yearlyPlanner` mutation - Annual content calendars
  - Uses streaming via Vercel AI SDK's `generateText()` function

## Data Storage

**Databases:**

Primary PostgreSQL - Payload CMS data (users, products, orders, pages, media)
- Connection: `DATABASE_URI` (Neon PostgreSQL: `postgresql://...@ep-empty-fog-agq509y5-pooler.c-2.eu-central-1.aws.neon.tech`)
- Client: `@payloadcms/db-postgres` 3.70.0 for Payload collections
- Client: `postgres` 3.4.5 + Drizzle ORM 0.38.3 for Planner app
- Schema: Managed by Payload CMS (auto) and Drizzle (manual via drizzle-kit)
- Connection Pool: Neon pooler configured in connection string

**File Storage:**
- Vercel Blob Storage - CDN for media uploads
  - Token: `BLOB_READ_WRITE_TOKEN` env var
  - Implementation: `@payloadcms/storage-vercel-blob` 3.70.0
  - Collections: `media` collection configured for automatic upload
  - CDN URLs: `*.public.blob.vercel-storage.com` (image remotePatterns in Next.js config)
  - Fallback: Disabled in config, but could use local filesystem

**Caching:**
- None configured (no Redis or in-memory cache detected)
- Browser cache: LocalStorage used for cart persistence via Zustand store (`poynt-cart` key)

## Authentication & Identity

**Auth Provider:**
- Better Auth 1.2.5 - Custom authentication framework
  - Implementation: `@poynt/planner-auth` package with server/client exports
  - Server: `packages/planner-auth/server.ts`
  - Client: `packages/planner-auth/client.ts`
  - Auth Strategy: Session-based authentication with Better Auth
  - Environment: `BETTER_AUTH_URL` (http://localhost:3000 in dev)
  - Database Integration: Uses PostgreSQL via `@poynt/planner-db`
  - Payload CMS Integration: User authentication via Payload's built-in auth at `users` collection (roles: admin, customer)

**Authorization:**
- Payload CMS role-based access control (RBAC) for admin panel
- User roles stored in Payload `users` collection
- Stripe customer ID linked to user records for payment history

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Rollbar, or similar configured)
- Console logging used for debugging (`console.error()`, `console.log()`)

**Logs:**
- Console output (stdout/stderr) for development
- Server logs in production via host provider (Vercel logs, etc.)
- No centralized logging service configured

**Metrics:**
- Stripe Dashboard for payment metrics
- Payload CMS admin panel for content metrics
- No application performance monitoring (APM) detected

## CI/CD & Deployment

**Hosting:**
- Vercel (inferred from Next.js 16, Vercel Blob integration, next.config.mjs)
- Deployment: `bun run build && next start` or Vercel auto-deploy

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or CircleCI files present)
- Biome checks available via `bun run check` and `bun run check:ci` (CI-friendly variant)
- TypeScript checking: `bun run typecheck`
- ESLint: `bun run lint`

**Database Migrations:**
- Payload CMS: Auto-schema creation via ORM (push: false to prevent conflicts)
- Drizzle ORM: Manual migrations via `bun run db:generate`, `bun run db:migrate`, `bun run db:push` in planner-db package
- Migration files: Managed by Drizzle Kit

## Environment Configuration

**Required env vars (Turbo global):**
```
DATABASE_URI              # PostgreSQL connection string (Neon)
PAYLOAD_SECRET           # Payload CMS encryption secret
BETTER_AUTH_SECRET       # Better Auth session secret
BETTER_AUTH_URL          # Auth callback URL
OPENAI_API_KEY           # OpenAI API key for AI features
STRIPE_SECRET_KEY        # Stripe API secret key
STRIPE_WEBHOOK_SECRET    # Stripe webhook signature secret
RESEND_API_KEY           # Resend email API key
```

**Optional env vars:**
```
BLOB_READ_WRITE_TOKEN    # Vercel Blob storage token (disables Blob if not set)
NEXT_PUBLIC_URL          # Frontend URL (default: http://localhost:3000)
NEXT_PUBLIC_SERVER_URL   # Server URL for API calls
NEXT_ALLOW_PRIVATE_IMAGES# Allow private images in Next.js
RESEND_AUDIENCE_ID       # Resend audience ID for newsletter
```

**Secrets location:**
- Development: `.env.local` (git-ignored)
- Production: Vercel Environment Variables or host provider secrets
- Payload CMS: Stored in PostgreSQL (encrypted)

## Webhooks & Callbacks

**Incoming Webhooks:**

Stripe Webhook Endpoint:
- Route: `POST /api/webhooks/stripe`
- Location: `apps/web/app/api/webhooks/stripe/route.ts`
- Events Handled: `checkout.session.completed`
- Processing: Creates order record in Payload, sends order confirmation email via Resend
- Signature Verification: HMAC-SHA256 via `stripe.webhooks.constructEvent()`

**Outgoing Webhooks:**

Newsletter Subscription:
- Route: `POST /api/newsletter`
- Location: `apps/web/app/api/newsletter/route.ts`
- Action: Calls `subscribeToNewsletter()` to add contact to Resend audience
- Response: JSON success/error message

Checkout Session:
- Route: `POST /api/checkout`
- Location: `apps/web/app/api/checkout/route.ts`
- Action: Creates Stripe checkout session with redirect URLs
- Success URL: `{NEXT_PUBLIC_URL}/kvittering?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `{NEXT_PUBLIC_URL}/handlekurv`

**No GraphQL Subscriptions or WebSocket connections detected**

## Third-Party Dependencies for Integration

- `@hookform/resolvers` 5.2.2 - Form validation integration
- `@tanstack/react-query` 5.60.0 - Server state management and API caching
- `@trpc/client`, `@trpc/react-query`, `@trpc/server` 11.0.0 - Type-safe API communication
- `drizzle-orm` 0.38.3 - Database ORM for Planner package
- `nanoid` 5.0.9 - Unique ID generation for Planner API
- `graphql` 16.8.1 - GraphQL client (Payload CMS GraphQL interface at `/(payload)/graphql`)

---

*Integration audit: 2026-02-03*
