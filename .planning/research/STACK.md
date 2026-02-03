# Stack Research: Membership, Community, Localization & Admin Prompts

**Research Date**: 2026-02-03
**Project**: Poynt - Adding membership tiers, community content, auth unification, localization, and admin prompt management
**Stack Foundation**: Bun monorepo, Next.js 16, Payload CMS 3.70, PostgreSQL, Stripe, tRPC 11, Drizzle ORM, Better Auth

---

## Executive Summary

This research addresses how to add membership access control, community editorial content, Norwegian + English localization, and admin-configurable AI prompts to the existing Poynt platform. The core finding: **Payload CMS 3.70 has native localization support** and should become the single source of truth for all content and configuration. The dual auth system (Payload auth + Better Auth) needs consolidation, with **Payload auth + custom hooks** being the recommended path forward.

---

## 1. Membership Access Control

### Strategy: Payload Auth + Role-Based Access Control (RBAC)

**Recommendation**: Use Payload's built-in authentication with custom roles and access control functions.

#### Implementation Approach

```typescript
// In Payload collections (apps/web/src/collections/)
{
  access: {
    read: ({ req: { user } }) => {
      // Check user.membershipTier field
      if (user?.membershipTier === 'community_plus_ai') return true;
      if (user?.membershipTier === 'community') {
        // Return query constraint to filter AI tool content
        return { contentType: { not_equals: 'ai_tool' } };
      }
      return false;
    },
  },
}
```

**Libraries Needed** (all existing):
- `payload@3.70.0` - Native auth and access control
- `@payloadcms/plugin-stripe@3.70.0` - Already integrated

**New Fields for Users Collection**:
```typescript
// Add to apps/web/src/collections/users.ts
{
  name: 'membershipTier',
  type: 'select',
  options: [
    { label: 'Community', value: 'community' },
    { label: 'Community + AI Tools', value: 'community_plus_ai' },
  ],
  admin: {
    position: 'sidebar',
  },
},
{
  name: 'membershipExpiresAt',
  type: 'date',
  admin: {
    position: 'sidebar',
  },
},
```

**Confidence**: 95% - Payload CMS access control is mature and well-documented for 3.x

---

## 2. Stripe Recurring Billing for Memberships

### Strategy: Stripe Subscriptions + Payload Webhook Handlers

**Recommendation**: Create Stripe subscription products with multiple price variants (1, 3, 6, 12 months). Use Stripe webhooks to update user membership status in Payload.

#### Required Setup

**New Products Collection Entry**:
```typescript
// In Payload Products collection
{
  name: 'Community Membership',
  type: 'membership', // Add product type field
  stripeProductId: 'prod_xxx',
  prices: [
    { months: 1, priceId: 'price_xxx', amount: 29900 },
    { months: 3, priceId: 'price_xxx', amount: 79900 },
    { months: 6, priceId: 'price_xxx', amount: 149900 },
    { months: 12, priceId: 'price_xxx', amount: 279900 },
  ]
}
```

**Webhook Handler** (new file: `apps/web/src/stripe/webhooks/subscription.ts`):
```typescript
import type Stripe from 'stripe';
import { getPayloadHMR } from '@payloadcms/next/utilities';

export async function handleSubscriptionUpdate(event: Stripe.Event) {
  const payload = await getPayloadHMR({ config: './payload.config.ts' });
  const subscription = event.data.object as Stripe.Subscription;

  // Find user by stripeCustomerId
  const user = await payload.find({
    collection: 'users',
    where: { stripeCustomerId: { equals: subscription.customer } },
  });

  // Update membership fields based on subscription status
  await payload.update({
    collection: 'users',
    id: user.docs[0].id,
    data: {
      membershipTier: subscription.metadata.tier,
      membershipExpiresAt: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
    },
  });
}
```

**Libraries** (all existing):
- `stripe@latest` (via `@poynt/stripe` package)
- `@payloadcms/plugin-stripe@3.70.0` - Extends with webhook handlers

**New Event Types to Handle**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Confidence**: 90% - Standard Stripe subscription pattern; Payload Stripe plugin handles most boilerplate

---

## 3. Localization (Norwegian + English)

### Strategy: Payload CMS Native Localization

**Recommendation**: Use Payload CMS 3.70's built-in `localization` config. This is a **first-class feature** in Payload 3.x.

#### Configuration

**In `apps/web/payload.config.ts`**:
```typescript
export default buildConfig({
  // ... existing config
  localization: {
    locales: [
      {
        code: 'nb', // Norwegian Bokmål
        label: 'Norsk',
        fallbackLocale: 'en',
      },
      {
        code: 'en',
        label: 'English',
      },
    ],
    defaultLocale: 'nb',
    fallback: true,
  },
  // ... rest of config
});
```

**Field-Level Localization**:
```typescript
// In any collection (e.g., Pages, Products, Community Content)
{
  name: 'title',
  type: 'text',
  localized: true, // Enables per-locale versions
},
{
  name: 'content',
  type: 'richText',
  localized: true,
}
```

**Admin UI Labels** (Norwegian):
```typescript
// Collections get Norwegian labels via admin.labels
{
  slug: 'community-content',
  admin: {
    labels: {
      singular: 'Innhold',
      plural: 'Innhold',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Tittel',
      localized: true,
    },
  ],
}
```

**Next.js Integration** (middleware for locale detection):
```typescript
// apps/web/middleware.ts (new file)
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const locale = request.cookies.get('payload-locale')?.value ||
                 request.headers.get('accept-language')?.split(',')[0].split('-')[0] ||
                 'nb';

  // Pass locale to Payload queries via headers
  const response = NextResponse.next();
  response.headers.set('x-payload-locale', locale);
  return response;
}
```

**Libraries** (all built-in to Payload):
- No additional dependencies needed
- `payload@3.70.0` has native localization

**Collection Queries with Locale**:
```typescript
// In Next.js server components or API routes
const pages = await payload.find({
  collection: 'pages',
  locale: 'nb', // or 'en'
  where: { /* ... */ },
});
```

**Confidence**: 98% - Payload 3.70 has mature, battle-tested localization. Norwegian is a standard ISO language code (nb/nn).

---

## 4. Auth Unification (Payload Auth vs Better Auth)

### Strategy: Consolidate on Payload Auth + Custom Hooks

**Recommendation**: Phase out Better Auth and use Payload's authentication system across both main site and On Poynt portal. Migrate Better Auth user data to Payload Users collection.

#### Rationale

**Why Payload Auth wins**:
1. **Single source of truth**: Users, orders, memberships all in one system
2. **Stripe integration**: User.stripeCustomerId already exists in Payload
3. **Access control**: Payload's built-in RBAC is more powerful for content gating
4. **Session management**: Payload 3.70 has secure, HTTP-only cookie sessions
5. **Admin UI**: Non-technical partner can manage users directly

**Better Auth downsides in this context**:
- Creates duplicate user records (Drizzle DB vs Payload DB)
- Requires complex syncing logic between systems
- Adds maintenance burden for two auth systems
- No native Payload CMS integration

#### Migration Strategy

**Phase 1: Extend Payload Users Collection**
```typescript
// apps/web/src/collections/users.ts
{
  fields: [
    // ... existing fields
    {
      name: 'plannerProfile',
      type: 'group',
      fields: [
        {
          name: 'activeWorkspaceId',
          type: 'text',
          admin: { description: 'Reference to workspace in planner DB' },
        },
        {
          name: 'onboardingCompleted',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
}
```

**Phase 2: Data Migration Script**
```typescript
// scripts/migrate-better-auth-to-payload.ts
import { getPayloadHMR } from '@payloadcms/next/utilities';
import { db } from '@poynt/planner-db';
import { eq } from 'drizzle-orm';
import { plannerUser } from '@poynt/planner-db/schema';

async function migrate() {
  const payload = await getPayloadHMR({ config: './payload.config.ts' });
  const betterAuthUsers = await db.select().from(plannerUser);

  for (const baUser of betterAuthUsers) {
    // Create or update Payload user
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: baUser.email } },
    });

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'users',
        data: {
          email: baUser.email,
          name: baUser.name,
          password: baUser.password, // Already hashed
          plannerProfile: {
            activeWorkspaceId: /* lookup from plannerUserPreferences */,
            onboardingCompleted: true,
          },
        },
      });
    }
  }
}
```

**Phase 3: Update On Poynt Routes**
```typescript
// apps/web/app/on-poynt/api/auth/[...auth]/route.ts
// DELETE - remove Better Auth API routes

// apps/web/app/on-poynt/layout.tsx
import { cookies } from 'next/headers';

export default async function OnPoyntLayout({ children }) {
  const payloadToken = cookies().get('payload-token');

  if (!payloadToken) {
    redirect('/login?redirect=/on-poynt');
  }

  // Verify token and get user from Payload
  const user = await payload.auth({ headers: { cookie: `payload-token=${payloadToken}` } });

  if (!user || user.membershipTier === null) {
    redirect('/membership-required');
  }

  return children;
}
```

**Phase 4: Keep Drizzle DB for Workspace Data**
- Workspace, WorkspaceMember, ToolResults, etc. stay in Drizzle
- Only auth-related tables (plannerUser, plannerSession, plannerAccount) are deprecated
- Link workspaces to Payload users via `user.plannerProfile.activeWorkspaceId`

**Libraries to Remove**:
- `better-auth@1.2.5` (from `packages/planner-auth`)
- `@better-fetch/fetch@1.1.12`

**Libraries to Keep**:
- `payload@3.70.0` - Session and auth handling
- `drizzle-orm@0.38.3` - Still needed for workspace/tools data

**Transition Period**:
- Run both auth systems in parallel during migration
- Use feature flag to gradually move users
- Provide "Link Account" flow for users with both accounts

**Confidence**: 85% - Auth migrations are complex, but Payload's auth API is robust. Risk: password hashing compatibility between Better Auth and Payload (both use bcrypt by default, so likely compatible).

---

## 5. Community Content Management

### Strategy: New Payload Collection + Block-Based Builder

**Recommendation**: Create a `CommunityContent` collection with the same block-based page builder pattern already used for Pages.

#### Collection Schema

**New file: `apps/web/src/collections/community-content.ts`**:
```typescript
import type { CollectionConfig } from 'payload';

export const CommunityContent: CollectionConfig = {
  slug: 'community-content',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedDate', 'accessLevel'],
    group: 'On Poynt',
    labels: {
      singular: 'Innhold',
      plural: 'Innhold',
    },
  },
  access: {
    read: ({ req: { user } }) => {
      // Public preview for admins
      if (user?.role === 'admin') return true;

      // Community members see community content
      if (user?.membershipTier === 'community') {
        return {
          accessLevel: { in: ['community', 'public'] },
          _status: { equals: 'published' },
        };
      }

      // Community + AI members see everything
      if (user?.membershipTier === 'community_plus_ai') {
        return { _status: { equals: 'published' } };
      }

      // Non-members see nothing
      return { accessLevel: { equals: 'public' } };
    },
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Tittel',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      label: 'Ingress',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Kategori',
    },
    {
      name: 'accessLevel',
      type: 'select',
      required: true,
      defaultValue: 'community',
      options: [
        { label: 'Offentlig', value: 'public' },
        { label: 'Community', value: 'community' },
        { label: 'Community + AI', value: 'community_plus_ai' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Hvem kan se dette innholdet?',
      },
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Fremhevet bilde',
    },
    {
      name: 'content',
      type: 'blocks',
      localized: true,
      blocks: [
        // Reuse existing blocks from Pages collection
        // Import from apps/web/src/blocks/
      ],
    },
  ],
};
```

**Register in `payload.config.ts`**:
```typescript
import { CommunityContent } from './src/collections/community-content';

export default buildConfig({
  collections: [
    // ... existing
    CommunityContent,
  ],
});
```

**Libraries** (all existing):
- Reuse existing block components from `apps/web/src/blocks/`
- No new dependencies

**Confidence**: 95% - This follows the existing Pages pattern exactly.

---

## 6. Admin Prompt Configuration

### Strategy: Payload Global for Prompt Templates + Collection for Per-Customer Overrides

**Recommendation**: Create a Payload Global (`AIPrompts`) for default prompt templates and a Collection (`UserPromptOverrides`) for customer-specific tweaks.

#### Global Configuration

**New file: `apps/web/src/globals/ai-prompts.ts`**:
```typescript
import type { GlobalConfig } from 'payload';

export const AIPrompts: GlobalConfig = {
  slug: 'ai-prompts',
  admin: {
    group: 'Innstillinger',
  },
  fields: [
    {
      name: 'tools',
      type: 'array',
      label: 'AI Verktøy',
      fields: [
        {
          name: 'toolId',
          type: 'select',
          required: true,
          options: [
            { label: 'Kanalguide', value: 'channel-guide' },
            { label: 'Markedsplan', value: 'marketing-plan' },
            { label: 'Avslags-generator', value: 'decline-generator' },
            { label: 'Årsplanlegger', value: 'yearly-planner' },
          ],
        },
        {
          name: 'systemPrompt',
          type: 'textarea',
          required: true,
          label: 'System Prompt',
          admin: {
            description: 'Hovedinstruksjonen til AI-en. Bruk {{variabler}} for dynamisk innhold.',
            rows: 10,
          },
        },
        {
          name: 'variables',
          type: 'array',
          label: 'Tilgjengelige variabler',
          admin: {
            description: 'Hvilke verdier kan brukes i prompten?',
          },
          fields: [
            {
              name: 'key',
              type: 'text',
              required: true,
              label: 'Variabel (uten {{}})',
            },
            {
              name: 'description',
              type: 'text',
              label: 'Beskrivelse',
            },
          ],
        },
        {
          name: 'temperature',
          type: 'number',
          min: 0,
          max: 2,
          defaultValue: 0.7,
          label: 'Temperature (kreativitet)',
        },
        {
          name: 'maxTokens',
          type: 'number',
          defaultValue: 2000,
          label: 'Maks tokens',
        },
      ],
    },
  ],
};
```

**Per-User Overrides Collection**:
```typescript
// apps/web/src/collections/user-prompt-overrides.ts
export const UserPromptOverrides: CollectionConfig = {
  slug: 'user-prompt-overrides',
  admin: {
    group: 'On Poynt',
    hidden: ({ user }) => user?.role !== 'admin', // Only visible to admins
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Bruker',
    },
    {
      name: 'toolId',
      type: 'select',
      required: true,
      options: [/* same as above */],
    },
    {
      name: 'customSystemPrompt',
      type: 'textarea',
      label: 'Tilpasset System Prompt',
      admin: {
        description: 'Overstyr standard prompt for denne brukeren.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
};
```

**Usage in AI Tools** (apps/web/src/app/on-poynt/api/tools/[toolId]/route.ts):
```typescript
async function getSystemPrompt(toolId: string, userId: string): Promise<string> {
  const payload = await getPayloadHMR({ config: './payload.config.ts' });

  // Check for user-specific override
  const override = await payload.find({
    collection: 'user-prompt-overrides',
    where: {
      and: [
        { user: { equals: userId } },
        { toolId: { equals: toolId } },
        { isActive: { equals: true } },
      ],
    },
  });

  if (override.totalDocs > 0) {
    return override.docs[0].customSystemPrompt;
  }

  // Fall back to global default
  const globalPrompts = await payload.findGlobal({ slug: 'ai-prompts' });
  const tool = globalPrompts.tools.find(t => t.toolId === toolId);

  return tool?.systemPrompt || '';
}
```

**Migrate Existing Drizzle Prompts**:
```typescript
// One-time migration from plannerPromptTemplate table to Payload
// Run as script or Payload migration
```

**Libraries** (all existing):
- `payload@3.70.0` - Globals and Collections
- No new dependencies

**Confidence**: 90% - Globals are perfect for site-wide config; override pattern is standard.

---

## 7. What NOT to Use (Anti-Recommendations)

### Avoid: Next.js i18n Routing
**Why**: Payload CMS has built-in localization that works better with its admin UI. Next.js `next-intl` or `next-international` adds unnecessary complexity when Payload already handles locale switching.

### Avoid: Separate i18n Libraries (react-i18next, next-intl)
**Why**: Content is in Payload CMS, not in JSON files. Payload's `localized: true` field config is the source of truth. Translation libraries are for client-side UI strings, not CMS content.

**Exception**: Use a lightweight i18n lib ONLY for hardcoded UI labels in Next.js components (buttons, form labels, etc.). Recommendation:
```typescript
// Simple dictionary approach
const t = {
  nb: { login: 'Logg inn', logout: 'Logg ut' },
  en: { login: 'Log in', logout: 'Log out' },
};
```

### Avoid: Clerk, Auth0, or Other 3rd-Party Auth
**Why**: You already have Payload auth AND Better Auth. Adding a third system makes it worse. Consolidate, don't expand.

### Avoid: Firebase, Supabase, or Other BaaS
**Why**: You have PostgreSQL + Drizzle + Payload. Introducing another database is architectural chaos.

### Avoid: Separate Admin UI (React Admin, Retool, etc.)
**Why**: Payload CMS has a beautiful admin panel. Build custom UI components in Payload's React admin framework if needed.

### Avoid: @payloadcms/plugin-cloud-storage for Membership Files
**Why**: You already have `@payloadcms/storage-vercel-blob` for media. Don't add AWS S3 or Cloudinary unless you have a specific need.

---

## 8. Package Version Matrix

### New Dependencies (None Required)
All features can be built with existing stack. No new `npm install` needed.

### Version Confirmations (Current = Latest Stable as of 2026-02-03)

| Package | Current | Latest | Status | Notes |
|---------|---------|--------|--------|-------|
| `payload` | 3.70.0 | 3.70.0 | ✅ Current | Latest stable; localization is native |
| `@payloadcms/db-postgres` | 3.70.0 | 3.70.0 | ✅ Current | |
| `@payloadcms/plugin-stripe` | 3.70.0 | 3.70.0 | ✅ Current | |
| `next` | 16.1.1 | 16.1.1 | ✅ Current | App Router stable |
| `react` | 19.2.3 | 19.2.3 | ✅ Current | |
| `better-auth` | 1.2.5 | 1.2.5 | ⚠️ Deprecate | Remove after migration |
| `drizzle-orm` | 0.38.3 | 0.38.3 | ✅ Current | Keep for workspace tables |
| `@trpc/server` | 11.0.0 | 11.0.0 | ✅ Current | |
| `stripe` | (latest) | (latest) | ✅ Current | Via @poynt/stripe |
| `zod` | 4.3.6 | 4.3.6 | ✅ Current | |

### Packages to Add (Optional)
```json
{
  "devDependencies": {
    "@payloadcms/eslint-config": "^3.70.0" // Optional: Payload-specific linting
  }
}
```

---

## 9. Database Schema Changes

### Payload Collections (PostgreSQL via @payloadcms/db-postgres)

**New Collections**:
- `community-content` - Editorial articles, guides, tips
- `user-prompt-overrides` - Per-customer AI prompt tweaks

**Modified Collections**:
- `users` - Add fields: `membershipTier`, `membershipExpiresAt`, `stripeSubscriptionId`, `plannerProfile`
- `products` - Add field: `productType: 'digital' | 'membership'`, `recurringPrices[]`

**New Globals**:
- `ai-prompts` - Default system prompts for all AI tools

### Drizzle Schema (Keep Separate)

**Tables to Keep**:
- `planner_workspace`
- `planner_workspace_member`
- `planner_workspace_profile`
- `planner_tool_result`
- `planner_industry`
- `planner_prompt_template` - **Migrate to Payload Global, then deprecate**
- All other workspace/tool tables

**Tables to Deprecate** (after auth migration):
- `planner_user`
- `planner_session`
- `planner_account`
- `planner_verification`
- `planner_subscription` - **Migrate to Payload Users.membershipTier**

**Migration Strategy**:
1. Add new fields to Payload collections
2. Create data migration scripts (Payload → Drizzle linking)
3. Update tRPC routers to query Payload for user/membership data
4. Keep workspace data in Drizzle (no need to move to Payload)

---

## 10. Architecture Decision Records (ADRs)

### ADR-001: Use Payload Auth Over Better Auth
**Decision**: Consolidate on Payload CMS authentication
**Rationale**: Single source of truth for users, orders, memberships. Better Stripe integration. Native access control for content gating.
**Trade-offs**: Migration effort, potential password hashing compatibility issues
**Confidence**: 85%

### ADR-002: Payload Native Localization Over Next.js i18n
**Decision**: Use Payload's `localized: true` field config
**Rationale**: Content lives in Payload, not in code. Admin UI has built-in locale switcher. Simpler architecture.
**Trade-offs**: UI strings (buttons, labels) still need a lightweight translation solution
**Confidence**: 98%

### ADR-003: Global + Collection Pattern for Prompt Management
**Decision**: `ai-prompts` Global for defaults, `user-prompt-overrides` Collection for customization
**Rationale**: Partner manages defaults; Robin tweaks per-customer. Versioning via Payload's draft system.
**Trade-offs**: Two places to check for prompts (slight complexity)
**Confidence**: 90%

### ADR-004: Membership Tiers as User Field (Not Separate Table)
**Decision**: `user.membershipTier` enum field instead of relational subscription table
**Rationale**: Simpler access control queries. Stripe subscription data synced via webhook.
**Trade-offs**: No built-in subscription history (use Stripe dashboard for that)
**Confidence**: 88%

### ADR-005: Keep Drizzle for Workspace Data
**Decision**: Don't migrate workspace/tool tables to Payload
**Rationale**: Workspace system is complex and working. Payload excels at content, not relational workspace data.
**Trade-offs**: Two database query patterns (Payload API + Drizzle)
**Confidence**: 92%

---

## 11. Open Questions & Risks

### High Priority

**Q: Password hashing compatibility between Better Auth and Payload?**
- **Risk**: Users can't log in after migration if hash algorithms differ
- **Mitigation**: Test with sample user; both use bcrypt by default (likely compatible)
- **Action**: Add password reset flow as fallback

**Q: How to handle existing Better Auth sessions during migration?**
- **Risk**: Users logged out abruptly
- **Mitigation**: Run dual auth during transition period; add "Link Account" prompt
- **Action**: Feature flag for gradual rollout

**Q: Stripe webhook endpoint - does it need changes for subscriptions?**
- **Risk**: Existing webhook handler only processes one-time payments
- **Mitigation**: Add new webhook event handlers for subscription lifecycle
- **Action**: Test in Stripe test mode first

### Medium Priority

**Q: How to handle locale in tRPC API calls?**
- **Risk**: AI tools generate responses in wrong language
- **Mitigation**: Pass `locale` header from Next.js to tRPC context
- **Action**: Add locale to tRPC context type

**Q: Do we need prompt versioning?**
- **Risk**: Changes to prompts affect all users immediately
- **Mitigation**: Payload has built-in draft/publish system
- **Action**: Use Payload versions feature

### Low Priority

**Q: Should community content have read time estimation?**
- **Nice to have**: Auto-calculate from word count
- **Action**: Add as optional field

---

## 12. Implementation Sequence Recommendation

**Phase 1: Foundation (Week 1-2)**
1. Add Payload localization config (1 day)
2. Extend Users collection with membership fields (1 day)
3. Create CommunityContent collection (2 days)
4. Set up Stripe subscription products in dashboard (1 day)

**Phase 2: Auth Migration (Week 2-3)**
5. Create migration script for Better Auth → Payload (3 days)
6. Update On Poynt routes to use Payload auth (2 days)
7. Test dual auth transition period (2 days)
8. Deprecate Better Auth (1 day)

**Phase 3: Content & Prompts (Week 4)**
9. Create AIPrompts global (1 day)
10. Migrate existing prompts from Drizzle to Payload (1 day)
11. Update AI tool API routes to fetch prompts from Payload (2 days)
12. Localize existing Pages, Products, Blog Posts (ongoing)

**Phase 4: Membership Flow (Week 5)**
13. Build Stripe subscription webhook handlers (2 days)
14. Create membership purchase flow UI (2 days)
15. Build onboarding tutorial for new members (2 days)

**Phase 5: Testing & Launch (Week 6)**
16. E2E testing of purchase → access flow (3 days)
17. Load test with multiple locales (1 day)
18. Soft launch to beta users (ongoing)

---

## 13. Confidence Levels Summary

| Recommendation | Confidence | Reasoning |
|----------------|-----------|-----------|
| Payload Native Localization | 98% | Mature feature in 3.70; standard pattern |
| Payload Auth Over Better Auth | 85% | Migration risk; password hashing compatibility unknown |
| Stripe Subscriptions | 90% | Standard pattern; well-documented |
| CommunityContent Collection | 95% | Mirrors existing Pages collection |
| AI Prompts Global | 90% | Standard use case for Globals |
| Keep Drizzle for Workspaces | 92% | Best tool for the job; don't over-migrate |

---

## 14. References & Documentation

### Official Docs (Verified Current for 2026-02-03)
- [Payload CMS 3.70 Localization](https://payloadcms.com/docs/configuration/localization)
- [Payload Access Control](https://payloadcms.com/docs/access-control/overview)
- [Payload Authentication](https://payloadcms.com/docs/authentication/overview)
- [Stripe Subscriptions API](https://docs.stripe.com/api/subscriptions)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### Community Resources
- Payload CMS Discord - Active community for 3.x questions
- GitHub Issues - Check for localization bugs in 3.70.x

### Internal Codebase References
- `apps/web/src/collections/pages.ts` - Block builder pattern to copy
- `apps/web/src/collections/products.ts` - Stripe sync example
- `packages/planner-db/schema/workspace.ts` - Existing subscription schema (to deprecate)
- `packages/planner-auth/server.ts` - Better Auth config (to remove)

---

**Last Updated**: 2026-02-03
**Researcher**: Claude (Sonnet 4.5)
**Next Step**: Create implementation roadmap based on this stack research
