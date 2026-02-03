# Architecture — Membership + Community + Localization + Admin Prompts

**Research Date:** 2026-02-03
**Researcher:** Claude Agent (GSD Project Researcher)
**Target System:** Poynt e-learning platform with On Poynt membership portal

## Executive Summary

This document defines the architectural integration strategy for adding **membership tiers**, **community content**, **dual-language localization**, and **admin prompt management** to the existing Payload CMS 3.70 + Next.js 16 + tRPC + Drizzle system.

**Critical Challenge:** Two separate auth systems exist (Payload auth for main site, Better Auth for On Poynt portal). Membership purchases on the main site must grant access to On Poynt portal content and AI tools based on tier.

**Recommended Strategy:** Single source of truth in Payload CMS for content, membership, and user roles, with Better Auth bridged to Payload user records via email matching and Stripe customer ID linking.

---

## 1. Current State Analysis

### 1.1 Existing Systems

**Payload CMS (Main Site)**
- Users collection with email/password auth, roles (admin, customer)
- Products collection synced to Stripe
- Orders collection with Stripe payment tracking
- Block-based page builder for public pages
- PostgreSQL database managed by Payload adapter

**On Poynt Portal (Separate App)**
- Better Auth with separate user table (`planner_user`)
- Drizzle ORM with manual migrations
- tRPC API for AI tools (channel guide, marketing plan, decline generator, yearly planner)
- Hardcoded navigation, tool descriptions, and UI text
- Workspace system with roles and profiles

**Integration Points**
- Both use same PostgreSQL database (different tables)
- Stripe integration on Payload side only
- No connection between Payload users and Better Auth users
- No content flow from Payload to On Poynt

### 1.2 Key Pain Points

1. **Dual auth barrier** — User buying membership on poynt.no (Payload) cannot automatically access On Poynt (Better Auth)
2. **Hardcoded content** — On Poynt navigation, tool descriptions, onboarding text all in code
3. **No membership tiers** — Current system has simple in/out access, no graduated tiers
4. **No localization** — All UI text in Norwegian, no English support
5. **No admin prompt management** — AI prompts hardcoded in tRPC routers, requires code changes

---

## 2. Component Architecture

### 2.1 Component Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                       PUBLIC SITE (frontend)                        │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐                │
│  │  Pages     │  │  Products   │  │  Blog/Cast   │                │
│  │  (Payload) │  │  (Payload)  │  │  (Payload)   │                │
│  └────────────┘  └─────────────┘  └──────────────┘                │
│         │                │                                          │
│         └────────────────┴─────────────> Stripe Checkout           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Purchase Complete (Webhook)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PAYLOAD CMS (Backend)                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Users Collection                                            │   │
│  │  - email, password (Payload auth)                            │   │
│  │  - stripeCustomerId                                          │   │
│  │  - membershipTier (new)                                      │   │
│  │  - membershipStatus (new)                                    │   │
│  │  - locale (new)                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Memberships Collection (new)                                │   │
│  │  - name, slug, stripePriceId                                 │   │
│  │  - tier (community_only | community_plus_tools)              │   │
│  │  - billingPeriod (1mo, 3mo, 6mo, 12mo)                       │   │
│  │  - accessLevel                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  CommunityContent Collection (new)                           │   │
│  │  - title, slug, richText (Norwegian + English)               │   │
│  │  - category, tier (who can see it)                           │   │
│  │  - publishedAt                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  PromptTemplates Collection (new)                            │   │
│  │  - toolId, locale, template, isActive                        │   │
│  │  - Admin GUI for editing prompts                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  OnPoyntSettings Global (new)                                │   │
│  │  - appName, navigation, tool descriptions (Norwegian + EN)   │   │
│  │  - Onboarding tutorial content                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Account Linking / SSO Bridge
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   ON POYNT PORTAL (on-poynt)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Better Auth Session                                         │   │
│  │  - Links to Payload user via email + stripeCustomerId       │   │
│  │  - Reads membershipTier and locale from Payload              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Community Content Pages (SSR from Payload)                  │   │
│  │  - Fetch CommunityContent filtered by tier + locale          │   │
│  │  - Render as dynamic routes in /on-poynt/community/[slug]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  AI Tools (tRPC + OpenAI)                                    │   │
│  │  - Access gated by membershipTier check                      │   │
│  │  - System prompts fetched from PromptTemplates by locale     │   │
│  │  - Workspace system (existing Drizzle tables)                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Boundaries

**Payload CMS Domain** (apps/web/src/collections, apps/web/src/globals)
- Owns: User records, membership products, orders, community content, prompt templates, On Poynt settings
- Responsibilities: Content management, auth for main site, Stripe sync, admin GUI
- Interfaces: Payload REST API, GraphQL, `getPayload()` SDK

**On Poynt Portal Domain** (apps/web/app/(on-poynt))
- Owns: Better Auth sessions, workspace data, tool results, user preferences
- Responsibilities: AI tool execution, workspace management, content display
- Interfaces: tRPC API, Better Auth endpoints

**Bridge Layer** (new, apps/web/lib/auth-bridge.ts)
- Owns: Auth unification logic, membership tier resolution
- Responsibilities: Link Better Auth session to Payload user, check membership access
- Interfaces: Helper functions called by tRPC context and On Poynt layouts

---

## 3. Data Flow

### 3.1 Membership Purchase Flow

```
1. Customer browses /produkter, finds "Medlemskap — Community + AI Verktøy (3 måneder)"
   └─> Product type: "membership", tier: "community_plus_tools", billingPeriod: "3mo"

2. Add to cart (Zustand), checkout via /api/checkout
   └─> Stripe checkout session created with membership price ID

3. Payment succeeds, Stripe webhook hits /api/webhooks/stripe
   └─> Webhook handler creates Order record, updates User:
       - membershipTier = "community_plus_tools"
       - membershipStatus = "active"
       - membershipPeriodEnd = date + 3 months
       - stripeCustomerId = session.customer

4. Email sent to customer with onboarding link: /on-poynt/onboarding?email={email}

5. Customer clicks link, arrives at On Poynt onboarding page
   └─> Server checks if Better Auth account exists with matching email
       - YES: Auto-login (session cookie set)
       - NO: Show "Create Account" form (pre-filled email, asks for password)

6. After Better Auth login, middleware checks Payload user membership tier
   └─> Redirects to /on-poynt/oversikt (community + tools) or /on-poynt/community (community only)

7. Dashboard shows personalized onboarding tutorial (from OnPoyntSettings global)
```

### 3.2 Content Display Flow

```
1. User navigates to /on-poynt/community/introduksjon
   └─> Server-side page fetches user session (Better Auth)

2. Bridge layer resolves Payload user via email match
   └─> Returns { membershipTier, locale, membershipStatus }

3. Server calls getPayload().find({
     collection: 'community-content',
     where: { slug: { equals: 'introduksjon' }, locale: { equals: userLocale } }
   })

4. Access check:
   - Content tier = "community_only" → Allow if user has any active membership
   - Content tier = "community_plus_tools" → Allow only if user has community_plus_tools tier

5. Render CommunityContentPage component with fetched content + layout from OnPoyntSettings
```

### 3.3 AI Tool Access Flow

```
1. User navigates to /on-poynt/verktoy/kanalveileder
   └─> Server layout fetches session + resolves membership tier via bridge

2. Access gate checks tier:
   - "community_only" → Redirect to /on-poynt/oppgrader with upsell message
   - "community_plus_tools" → Allow access

3. Tool page loads, user fills questionnaire, submits to tRPC ai.channelGuide()

4. tRPC procedure:
   a. Context middleware resolves userId (Better Auth)
   b. Bridge resolves Payload user → membershipTier + locale
   c. Fetch PromptTemplate where { toolId: 'channel-guide', locale, isActive: true }
   d. Call OpenAI with resolved system prompt
   e. Return result, save to tool_results table

5. Result displayed with locale-specific UI text from OnPoyntSettings
```

### 3.4 Admin Prompt Management Flow

```
1. Admin logs into Payload CMS admin (/admin)
   └─> Navigates to "AI Verktøy" collection group

2. Opens "Prompt Templates" collection
   └─> Lists all templates: channel-guide-no, channel-guide-en, marketing-plan-no, etc.

3. Edits "Kanalveileder System Prompt (Norsk)"
   - toolId: "channel-guide"
   - locale: "no"
   - template: "Du er en markedsføringsekspert..." (rich text editor)
   - variables: ["industry", "targetAudience", "budget"]
   - isActive: true (checkbox to enable/disable)

4. Saves, Payload writes to database

5. Next tRPC ai.channelGuide() call fetches updated prompt from DB
   └─> No code deployment needed
```

---

## 4. Auth Unification Strategy

### 4.1 The Problem

Two separate auth systems:
- **Payload Auth**: Email/password stored in `users` table (Payload managed), session via httpOnly cookie
- **Better Auth**: Email/password stored in `planner_user` + `planner_account` tables, session via Better Auth token

No shared session, no user ID mapping.

### 4.2 Recommended Solution: Payload as Source of Truth

**Approach:** Payload users are canonical. Better Auth sessions bridge to Payload users via email matching and Stripe customer ID.

**Implementation:**

1. **Extend Payload Users Collection** (`apps/web/src/collections/users.ts`)
   - Add fields: `membershipTier`, `membershipStatus`, `membershipPeriodEnd`, `locale`
   - Keep `stripeCustomerId` (already exists)

2. **Create Auth Bridge Helper** (`apps/web/lib/auth-bridge.ts`)
   ```typescript
   export async function getPayloadUserFromBetterAuthSession(session: Session) {
     const payload = await getPayload({ config: configPromise });
     const result = await payload.find({
       collection: 'users',
       where: { email: { equals: session.user.email } }
     });
     return result.docs[0] || null;
   }

   export async function checkMembershipAccess(
     payloadUser: User,
     requiredTier: 'community_only' | 'community_plus_tools'
   ): Promise<boolean> {
     if (!payloadUser.membershipStatus || payloadUser.membershipStatus !== 'active') {
       return false;
     }
     if (payloadUser.membershipPeriodEnd && new Date() > payloadUser.membershipPeriodEnd) {
       return false; // Expired
     }
     if (requiredTier === 'community_plus_tools' && payloadUser.membershipTier === 'community_only') {
       return false; // Insufficient tier
     }
     return true;
   }
   ```

3. **Update Better Auth on Signup** (`apps/web/app/(on-poynt)/on-poynt/registrer/page.tsx`)
   - After Better Auth creates `planner_user`, check if Payload user exists with same email
   - If yes, link by storing Payload user ID in planner_user metadata (add `payloadUserId` field to planner_user schema)
   - If no, optionally create Payload user as well (for unified user base)

4. **Update tRPC Context** (`packages/planner-api/trpc.ts`)
   ```typescript
   export interface Context {
     userId: string | null; // Better Auth user ID
     payloadUser: PayloadUser | null; // Resolved Payload user
     membershipTier: string | null;
     locale: string;
   }

   export async function createContext({ req }): Promise<Context> {
     const session = await auth.api.getSession({ headers: req.headers });
     if (!session) {
       return { userId: null, payloadUser: null, membershipTier: null, locale: 'no' };
     }
     const payloadUser = await getPayloadUserFromBetterAuthSession(session);
     return {
       userId: session.user.id,
       payloadUser,
       membershipTier: payloadUser?.membershipTier || null,
       locale: payloadUser?.locale || 'no'
     };
   }
   ```

5. **Gate AI Tools in tRPC Procedures**
   ```typescript
   export const aiRouter = router({
     channelGuide: publicProcedure
       .input(channelGuideRequestSchema)
       .mutation(async ({ input, ctx }) => {
         if (!ctx.payloadUser || !checkMembershipAccess(ctx.payloadUser, 'community_plus_tools')) {
           throw new TRPCError({ code: 'FORBIDDEN', message: 'Requires community_plus_tools membership' });
         }
         // Proceed with AI generation
       })
   });
   ```

### 4.3 Alternative: Unify Auth (Payload Only)

**Not Recommended** due to scope/risk, but noted for future consideration:
- Remove Better Auth entirely
- Use Payload auth for On Poynt portal
- Migrate existing planner_user records to Payload users
- Requires rewriting all auth flows in On Poynt (higher effort, higher risk of breaking existing functionality)

---

## 5. Membership Architecture

### 5.1 New Payload Collections

**Memberships Collection** (`apps/web/src/collections/memberships.ts`)

```typescript
export const Memberships: CollectionConfig = {
  slug: 'memberships',
  labels: { singular: 'Medlemskap', plural: 'Medlemskap' },
  admin: { useAsTitle: 'name', group: 'Butikk' },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Navn' },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug' },
    {
      name: 'tier',
      type: 'select',
      required: true,
      options: [
        { label: 'Community Only', value: 'community_only' },
        { label: 'Community + AI Verktøy', value: 'community_plus_tools' }
      ],
      label: 'Nivå'
    },
    {
      name: 'billingPeriod',
      type: 'select',
      required: true,
      options: [
        { label: '1 måned', value: '1mo' },
        { label: '3 måneder', value: '3mo' },
        { label: '6 måneder', value: '6mo' },
        { label: '12 måneder', value: '12mo' }
      ],
      label: 'Faktureringsperiode'
    },
    { name: 'price', type: 'number', required: true, label: 'Pris (øre)' },
    { name: 'stripePriceId', type: 'text', label: 'Stripe Price ID', admin: { readOnly: true } },
    { name: 'description', type: 'richText', label: 'Beskrivelse' },
    { name: 'features', type: 'array', label: 'Fordeler', fields: [
      { name: 'text', type: 'text', required: true, label: 'Fordel' }
    ]},
    { name: 'active', type: 'checkbox', defaultValue: true, label: 'Aktiv' }
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        // Create/update Stripe recurring price (similar to Products collection)
        if (!doc.stripePriceId) {
          const stripe = getStripe();
          const price = await stripe.prices.create({
            product: 'prod_membership', // Or create product per tier
            unit_amount: doc.price,
            currency: 'nok',
            recurring: { interval: 'month', interval_count: parseBillingPeriod(doc.billingPeriod) }
          });
          await req.payload.update({
            collection: 'memberships',
            id: doc.id,
            data: { stripePriceId: price.id }
          });
        }
      }
    ]
  }
};
```

**CommunityContent Collection** (`apps/web/src/collections/community-content.ts`)

```typescript
export const CommunityContent: CollectionConfig = {
  slug: 'community-content',
  labels: { singular: 'Fellesskapsinnhold', plural: 'Fellesskapsinnhold' },
  admin: { useAsTitle: 'title', group: 'On Poynt' },
  versions: { drafts: { autosave: true } },
  localization: { locales: ['no', 'en'], defaultLocale: 'no', fallback: true },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Tittel', localized: true },
    { name: 'slug', type: 'text', required: true, unique: true, label: 'Slug', localized: true },
    { name: 'content', type: 'richText', required: true, label: 'Innhold', localized: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Kom i gang', value: 'getting-started' },
        { label: 'Markedsføringstips', value: 'marketing-tips' },
        { label: 'Verktøyveiledninger', value: 'tool-guides' },
        { label: 'Ressurser', value: 'resources' }
      ],
      label: 'Kategori'
    },
    {
      name: 'requiredTier',
      type: 'select',
      options: [
        { label: 'Alle medlemmer', value: 'community_only' },
        { label: 'Kun Community + AI', value: 'community_plus_tools' }
      ],
      defaultValue: 'community_only',
      label: 'Krever nivå'
    },
    { name: 'publishedAt', type: 'date', label: 'Publiseringsdato', admin: { position: 'sidebar' } }
  ]
};
```

**PromptTemplates Collection** (`apps/web/src/collections/prompt-templates.ts`)

```typescript
export const PromptTemplates: CollectionConfig = {
  slug: 'prompt-templates',
  labels: { singular: 'Prompt-mal', plural: 'Prompt-maler' },
  admin: { useAsTitle: 'name', group: 'AI Verktøy' },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Navn' },
    {
      name: 'toolId',
      type: 'select',
      required: true,
      options: [
        { label: 'Kanalveileder', value: 'channel-guide' },
        { label: 'Markedsplan', value: 'marketing-plan' },
        { label: 'Avslag-generator', value: 'decline-generator' },
        { label: 'Årsplanlegger', value: 'yearly-planner' }
      ],
      label: 'Verktøy'
    },
    {
      name: 'locale',
      type: 'select',
      required: true,
      options: [
        { label: 'Norsk', value: 'no' },
        { label: 'English', value: 'en' }
      ],
      label: 'Språk'
    },
    { name: 'systemPrompt', type: 'textarea', required: true, label: 'System Prompt', admin: { description: 'Hoveddirektiv til AI-modellen' } },
    { name: 'userPromptTemplate', type: 'textarea', label: 'Bruker Prompt-mal', admin: { description: 'Template for brukerspørsmål (støtter variabler som {{industry}}, {{targetAudience}})' } },
    { name: 'variables', type: 'array', label: 'Tilgjengelige variabler', fields: [
      { name: 'key', type: 'text', required: true, label: 'Variabelnavn' },
      { name: 'description', type: 'text', label: 'Beskrivelse' }
    ]},
    { name: 'isActive', type: 'checkbox', defaultValue: true, label: 'Aktiv' },
    { name: 'version', type: 'number', defaultValue: 1, label: 'Versjon', admin: { readOnly: true } }
  ]
};
```

### 5.2 New Payload Globals

**OnPoyntSettings Global** (`apps/web/src/globals/on-poynt-settings.ts`)

```typescript
export const OnPoyntSettings: GlobalConfig = {
  slug: 'on-poynt-settings',
  label: 'On Poynt Innstillinger',
  admin: { group: 'On Poynt' },
  fields: [
    {
      name: 'appName',
      type: 'group',
      label: 'App-navn',
      fields: [
        { name: 'no', type: 'text', defaultValue: 'On Poynt', label: 'Norsk' },
        { name: 'en', type: 'text', defaultValue: 'On Poynt', label: 'English' }
      ]
    },
    {
      name: 'navigation',
      type: 'array',
      label: 'Navigasjon',
      fields: [
        { name: 'titleNo', type: 'text', required: true, label: 'Tittel (Norsk)' },
        { name: 'titleEn', type: 'text', required: true, label: 'Tittel (English)' },
        { name: 'url', type: 'text', required: true, label: 'URL' },
        { name: 'icon', type: 'text', label: 'Ikon (Lucide navn)' },
        {
          name: 'requiredTier',
          type: 'select',
          options: [
            { label: 'Alle', value: 'all' },
            { label: 'Community + AI', value: 'community_plus_tools' }
          ],
          defaultValue: 'all',
          label: 'Krever nivå'
        }
      ]
    },
    {
      name: 'tools',
      type: 'array',
      label: 'Verktøy',
      fields: [
        { name: 'titleNo', type: 'text', required: true, label: 'Tittel (Norsk)' },
        { name: 'titleEn', type: 'text', required: true, label: 'Tittel (English)' },
        { name: 'descriptionNo', type: 'textarea', label: 'Beskrivelse (Norsk)' },
        { name: 'descriptionEn', type: 'textarea', label: 'Beskrivelse (English)' },
        { name: 'icon', type: 'text', label: 'Ikon' },
        { name: 'href', type: 'text', required: true, label: 'Lenke' },
        { name: 'gradient', type: 'text', label: 'Gradient klasser' },
        { name: 'benefitsNo', type: 'array', label: 'Fordeler (Norsk)', fields: [{ name: 'text', type: 'text' }] },
        { name: 'benefitsEn', type: 'array', label: 'Fordeler (English)', fields: [{ name: 'text', type: 'text' }] }
      ]
    },
    {
      name: 'onboardingTutorial',
      type: 'group',
      label: 'Onboarding-veiledning',
      fields: [
        { name: 'titleNo', type: 'text', label: 'Tittel (Norsk)' },
        { name: 'titleEn', type: 'text', label: 'Tittel (English)' },
        { name: 'stepsNo', type: 'array', label: 'Steg (Norsk)', fields: [
          { name: 'title', type: 'text', label: 'Tittel' },
          { name: 'description', type: 'textarea', label: 'Beskrivelse' },
          { name: 'ctaText', type: 'text', label: 'Knappetekst' },
          { name: 'ctaUrl', type: 'text', label: 'Knapp-lenke' }
        ]},
        { name: 'stepsEn', type: 'array', label: 'Steg (English)', fields: [
          { name: 'title', type: 'text', label: 'Title' },
          { name: 'description', type: 'textarea', label: 'Description' },
          { name: 'ctaText', type: 'text', label: 'Button Text' },
          { name: 'ctaUrl', type: 'text', label: 'Button URL' }
        ]}
      ]
    }
  ]
};
```

### 5.3 Updates to Users Collection

Add fields to `apps/web/src/collections/users.ts`:

```typescript
{
  name: 'membershipTier',
  type: 'select',
  options: [
    { label: 'Ingen', value: 'none' },
    { label: 'Community Only', value: 'community_only' },
    { label: 'Community + AI Verktøy', value: 'community_plus_tools' }
  ],
  defaultValue: 'none',
  label: 'Medlemskapsnivå',
  admin: { position: 'sidebar' }
},
{
  name: 'membershipStatus',
  type: 'select',
  options: [
    { label: 'Aktiv', value: 'active' },
    { label: 'Avsluttet', value: 'canceled' },
    { label: 'Utgått', value: 'expired' },
    { label: 'Forfalt', value: 'past_due' }
  ],
  label: 'Medlemskapsstatus',
  admin: { position: 'sidebar' }
},
{
  name: 'membershipPeriodEnd',
  type: 'date',
  label: 'Medlemskap utløper',
  admin: { position: 'sidebar' }
},
{
  name: 'locale',
  type: 'select',
  options: [
    { label: 'Norsk', value: 'no' },
    { label: 'English', value: 'en' }
  ],
  defaultValue: 'no',
  label: 'Foretrukket språk',
  admin: { position: 'sidebar' }
}
```

---

## 6. Localization Architecture

### 6.1 Strategy

Use **Payload's built-in localization** for CMS content (CommunityContent, OnPoyntSettings) and **manual i18n pattern** for On Poynt UI components.

**Rationale:** Payload localization handles content well, but Next.js app already has complex routing (route groups) — adding next-intl or similar would conflict. Manual approach keeps control.

### 6.2 Implementation

**Payload Localization** (enabled in `payload.config.ts`)

```typescript
export default buildConfig({
  // ...
  localization: {
    locales: ['no', 'en'],
    defaultLocale: 'no',
    fallback: true
  },
  collections: [
    // Collections with localized fields get automatic locale filtering
    CommunityContent,
    // ...
  ]
});
```

**Manual UI Localization** (`apps/web/lib/i18n.ts`)

```typescript
const translations = {
  no: {
    'nav.home': 'Hjem',
    'nav.tools': 'Verktøy',
    'nav.community': 'Fellesskap',
    'tools.channel_guide.title': 'Kanalveileder',
    'tools.channel_guide.description': 'Finn de beste markedsføringskanalene...',
    // ...hundreds more keys
  },
  en: {
    'nav.home': 'Home',
    'nav.tools': 'Tools',
    'nav.community': 'Community',
    'tools.channel_guide.title': 'Channel Guide',
    'tools.channel_guide.description': 'Find the best marketing channels...',
    // ...
  }
};

export function t(key: string, locale: 'no' | 'en' = 'no'): string {
  return translations[locale][key] || key;
}
```

**Component Usage**

```tsx
// In server component
export default async function ChannelGuidePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const payloadUser = await getPayloadUserFromSession(session);
  const locale = payloadUser?.locale || 'no';

  const settings = await getPayload().findGlobal({ slug: 'on-poynt-settings', locale });

  return (
    <div>
      <h1>{locale === 'no' ? settings.tools[0].titleNo : settings.tools[0].titleEn}</h1>
      {/* ... */}
    </div>
  );
}
```

**Client Component Pattern**

```tsx
'use client';

import { t } from '@/lib/i18n';

export function ToolCard({ locale }: { locale: 'no' | 'en' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tools.channel_guide.title', locale)}</CardTitle>
      </CardHeader>
    </Card>
  );
}
```

### 6.3 Locale Detection Flow

```
1. User visits /on-poynt/oversikt
2. Server resolves Better Auth session → Payload user
3. Read user.locale (default: 'no')
4. Pass locale to all server component fetches (getPayload, OnPoyntSettings, CommunityContent)
5. Pass locale as prop to client components
6. User can change locale in /on-poynt/innstillinger/profil
   └─> Updates Payload user.locale field
   └─> Next visit uses new locale
```

---

## 7. Build Order & Dependencies

### 7.1 Phase 1: Foundation (Auth Bridge + Membership Collections)

**Goal:** Enable membership purchases to grant access to On Poynt.

**Tasks:**
1. Extend Payload Users collection with membership fields
2. Create Memberships collection with Stripe sync hooks
3. Implement auth bridge helper (`auth-bridge.ts`)
4. Update tRPC context to include `payloadUser` and `membershipTier`
5. Update Stripe webhook handler to set membership fields on purchase
6. Test: Purchase membership on main site → membership fields populated in Payload user

**Dependencies:** None, builds on existing Payload + Stripe integration.

**Estimated Effort:** 2-3 days

### 7.2 Phase 2: Community Content (Payload Collections + On Poynt Routes)

**Goal:** Display editorial community content in On Poynt portal.

**Tasks:**
1. Create CommunityContent collection with localization
2. Create OnPoyntSettings global for navigation/app branding
3. Add dynamic route `/on-poynt/community/[slug]/page.tsx`
4. Fetch CommunityContent from Payload based on slug + locale + tier
5. Replace hardcoded navigation in `app-sidebar.tsx` with OnPoyntSettings data
6. Test: Create community content in Payload admin → appears in On Poynt portal filtered by tier

**Dependencies:** Phase 1 (auth bridge needed to check tier access).

**Estimated Effort:** 3-4 days

### 7.3 Phase 3: Localization (i18n + Payload Locale Support)

**Goal:** Support Norwegian and English across On Poynt UI and CMS content.

**Tasks:**
1. Enable Payload localization in config for CommunityContent + OnPoyntSettings
2. Create `i18n.ts` helper with translation keys
3. Add `locale` field to Users collection
4. Update all On Poynt server components to pass locale prop
5. Update all client components to use `t()` helper
6. Migrate hardcoded Norwegian strings in `constants.ts` to OnPoyntSettings global
7. Test: Change user locale in settings → UI and content switch to English

**Dependencies:** Phase 2 (OnPoyntSettings must exist to hold localized navigation).

**Estimated Effort:** 4-5 days

### 7.4 Phase 4: Admin Prompt Management (PromptTemplates Collection + tRPC Integration)

**Goal:** Let admins edit AI prompts without code changes.

**Tasks:**
1. Create PromptTemplates collection in Payload
2. Seed default prompts for each tool (Norwegian + English)
3. Update tRPC AI procedures to fetch prompts from DB instead of hardcoded strings
4. Implement template variable substitution (`{{industry}}` → actual value)
5. Add version control to prompts (optional: keep history of changes)
6. Test: Edit channel guide prompt in admin → next AI generation uses new prompt

**Dependencies:** Phase 3 (locale needed to fetch correct prompt variant).

**Estimated Effort:** 3-4 days

### 7.5 Phase 5: Onboarding & Polish (Onboarding Flow + Tutorial)

**Goal:** Smooth onboarding from purchase to first login.

**Tasks:**
1. Create `/on-poynt/onboarding` page with email pre-fill + account creation
2. Implement auto-login if Better Auth account exists with matching email
3. Build onboarding tutorial component (carousel or step-by-step guide)
4. Populate OnPoyntSettings.onboardingTutorial with content
5. Add "Mark as completed" state (localStorage or DB flag)
6. Test: Complete purchase → receive email → onboarding flow → dashboard with tutorial

**Dependencies:** Phase 2 (OnPoyntSettings global), Phase 3 (localized onboarding text).

**Estimated Effort:** 2-3 days

### 7.6 Total Estimated Timeline

**Sequential Build:** ~14-19 days (assuming 1 developer, full-time)

**Parallel Build (2 developers):**
- Developer 1: Phases 1 → 4 (auth + content + prompts)
- Developer 2: Phase 3 → 5 (localization + onboarding)
- Total: ~10-12 days with coordination

---

## 8. Risk Mitigation

### 8.1 Key Risks

**Risk 1: Auth Bridge Complexity**
- **Impact:** High (blocks membership access flow)
- **Mitigation:** Start with simple email matching, add Stripe customer ID fallback. Test with real Stripe test mode purchases. Consider edge cases (user changes email, duplicate emails).

**Risk 2: Payload Localization Performance**
- **Impact:** Medium (slow page loads if many localized queries)
- **Mitigation:** Use Payload's `depth` parameter to avoid deep relationship fetching. Cache OnPoyntSettings global in memory (singleton pattern). Monitor query performance in Payload admin logs.

**Risk 3: Hardcoded Content Migration**
- **Impact:** Medium (breaking existing On Poynt UI during migration)
- **Mitigation:** Migrate incrementally — start with navigation, then tool descriptions, then UI strings. Keep old constants as fallback during transition. Feature flag to toggle between hardcoded and CMS-driven content.

**Risk 4: Prompt Template Breaking Changes**
- **Impact:** High (broken AI tools if prompts malformed)
- **Mitigation:** Validate prompt templates on save (Payload `validate` hook). Test prompts in admin with preview/sandbox mode. Keep version history, allow rollback to previous version. Add "isActive" flag to disable bad prompts without deleting.

**Risk 5: Membership Expiry Edge Cases**
- **Impact:** Medium (users lose access unexpectedly or keep access past expiry)
- **Mitigation:** Implement cron job or serverless function to check `membershipPeriodEnd` daily and update `membershipStatus` to "expired". Add grace period (e.g., 3 days). Show warning in UI 7 days before expiry. Stripe subscription webhooks handle auto-renewal.

---

## 9. Testing Strategy

### 9.1 Component Testing

**Payload Collections:**
- Create membership product → Verify Stripe price created
- Create community content with tier = community_only → Verify accessible to all members
- Edit prompt template → Verify changes reflected in AI tool output

**Auth Bridge:**
- Purchase membership with existing Better Auth account → Verify auto-linked
- Purchase membership with no Better Auth account → Verify onboarding flow creates account
- Expire membership → Verify access revoked in On Poynt

**Localization:**
- Change user locale to English → Verify UI and CommunityContent switch
- Fallback to default locale if English translation missing

### 9.2 Integration Testing

**End-to-End Purchase Flow:**
1. Add membership to cart (Zustand)
2. Checkout via Stripe test mode
3. Webhook fires → Order created, User membership updated
4. Onboarding email sent (stub Resend in test)
5. User clicks onboarding link → Auto-login or signup
6. Dashboard shows correct tier and content

**AI Tool Flow:**
- User with community_only tier tries to access channel guide → Blocked with upsell message
- User with community_plus_tools tier accesses channel guide → Prompt fetched from DB (English locale) → AI generates response → Result saved

### 9.3 Manual QA Checklist

- [ ] Membership purchase on main site grants On Poynt access
- [ ] Community content filters by tier correctly
- [ ] AI tools blocked for community_only tier
- [ ] Localization switches cleanly between Norwegian and English
- [ ] Onboarding tutorial displays on first login
- [ ] Admin can edit prompts without code deployment
- [ ] Navigation driven from OnPoyntSettings global
- [ ] Expired memberships lose access (cron tested manually)

---

## 10. Open Questions

**Q1: How to handle users who purchased before membership system exists?**
- **Option A:** Grandfather them into community_plus_tools tier (most generous)
- **Option B:** Set tier based on product type purchased (if identifiable)
- **Option C:** Email them to choose tier and re-purchase
- **Recommendation:** Option A for existing users, new system for future purchases.

**Q2: Should On Poynt content be searchable from main site?**
- **Impact:** SEO benefits vs. exclusive content argument
- **Recommendation:** Make community_only content public (SEO), keep community_plus_tools content gated. Add "Members Only" badge to search results.

**Q3: Stripe subscription vs. one-time purchase for memberships?**
- **Current:** Products are one-time purchases
- **Memberships:** Should use Stripe subscriptions for auto-renewal
- **Recommendation:** Use Stripe subscriptions with `cancel_at_period_end` for non-renewing option. Handle `customer.subscription.updated` and `customer.subscription.deleted` webhooks.

**Q4: How to migrate existing planner_user records to link with Payload users?**
- **Scenario:** Users already have Better Auth accounts but no Payload user
- **Recommendation:** Background migration script to create Payload users from planner_user records (match by email). Run once before Phase 1 launch.

**Q5: Should AI tool prompts support per-customer customization?**
- **Current Plan:** Global prompts managed by admin
- **Future Scope:** Per-workspace prompt overrides (stored in planner_workspace_profile)
- **Recommendation:** Out of scope for v1. Add in Phase 6 if needed.

---

## 11. Success Metrics

**Membership Adoption:**
- % of main site customers who purchase membership within 30 days of launch
- Community_only vs. community_plus_tools tier split
- Membership renewal rate (if subscriptions implemented)

**Content Engagement:**
- Community content page views per member
- Time spent on community content pages
- Most popular content categories

**Tool Usage:**
- AI tool invocations per member per month
- Upgrade rate from community_only to community_plus_tools (if upsell works)
- Tool result save rate (% of generations saved)

**Localization Impact:**
- % of users selecting English locale
- Engagement difference between Norwegian and English users

**Admin Efficiency:**
- Prompt edit frequency (admin making tweaks without developer)
- Time to deploy content changes (should be instant via Payload)

---

## Appendix A: File Map

**New Files to Create:**

```
apps/web/src/collections/memberships.ts
apps/web/src/collections/community-content.ts
apps/web/src/collections/prompt-templates.ts
apps/web/src/globals/on-poynt-settings.ts
apps/web/lib/auth-bridge.ts
apps/web/lib/i18n.ts
apps/web/app/(on-poynt)/on-poynt/community/[slug]/page.tsx
apps/web/app/(on-poynt)/on-poynt/onboarding/page.tsx
apps/web/app/(on-poynt)/on-poynt/oppgrader/page.tsx (upsell page)
apps/web/components/community/community-content-page.tsx
apps/web/components/planner/onboarding-tutorial.tsx
apps/web/components/planner/tier-gate.tsx
```

**Files to Modify:**

```
apps/web/src/collections/users.ts (add membership fields)
apps/web/payload.config.ts (register new collections/globals, enable localization)
apps/web/app/api/webhooks/stripe/route.ts (update membership on purchase)
packages/planner-api/trpc.ts (add payloadUser to context)
packages/planner-api/routers/ai.ts (fetch prompts from DB, tier gating)
packages/planner-db/schema/auth.ts (add payloadUserId to planner_user)
apps/web/components/planner/app-sidebar.tsx (fetch navigation from OnPoyntSettings)
apps/web/lib/constants.ts (migrate to OnPoyntSettings or deprecate)
apps/web/app/(on-poynt)/on-poynt/(app)/layout.tsx (resolve locale, pass to children)
```

**Migrations:**

```
packages/planner-db/drizzle/[timestamp]_add_payload_user_link.sql
packages/planner-db/drizzle/[timestamp]_migrate_existing_users.sql (optional)
```

---

## Appendix B: Glossary

- **Payload User**: User record in Payload CMS `users` collection (canonical source of truth)
- **Better Auth User**: User record in `planner_user` table (session management for On Poynt)
- **Auth Bridge**: Helper layer that links Better Auth sessions to Payload users via email matching
- **Membership Tier**: Access level (community_only or community_plus_tools)
- **Community Content**: Editorial articles/guides managed in Payload for On Poynt members
- **Prompt Template**: AI system prompt stored in Payload, editable by admins
- **Locale**: Language preference (no = Norwegian, en = English)
- **OnPoyntSettings**: Payload global holding app branding, navigation, and tool descriptions

---

**End of Architecture Document**
