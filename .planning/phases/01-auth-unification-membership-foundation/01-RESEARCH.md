# Phase 1: Auth Unification & Membership Foundation - Research

**Researched:** 2026-02-04
**Domain:** Authentication system bridging, session management, user provisioning
**Confidence:** MEDIUM

## Summary

Phase 1 requires bridging two independent authentication systems—Payload CMS (main site) and Better Auth (On Poynt)—into a unified membership model where Payload becomes the single source of truth for membership tier and status, while Better Auth handles actual authentication. The critical challenge is creating a reliable mapping between systems using email as the canonical identifier, with automated account provisioning via Stripe webhooks.

The standard approach is to maintain separate auth systems for their strengths (Better Auth for modern passwordless flows, Payload for CMS-integrated user management) while establishing a synchronization bridge that links users across databases via normalized email addresses. This requires webhook-driven account creation, email canonicalization to prevent duplicates, and session enrichment to resolve membership tier from Payload when validating Better Auth sessions.

Key technical risks include email mismatch (purchase email differs from login email), password hashing compatibility if migration is needed, webhook idempotency for duplicate events, and race conditions when purchases occur before accounts exist.

**Primary recommendation:** Use Better Auth for On Poynt authentication with Google social login and magic links, store membership tier in Payload Users collection with Stripe customer ID, create Better Auth accounts just-in-time via Stripe webhook, implement email normalization library to canonicalize addresses before matching, and build middleware to enrich Better Auth sessions with Payload membership data.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Better Auth | 1.2.5+ | Passwordless authentication for On Poynt | Modern auth library with built-in social login, magic links, multi-session support, and Drizzle adapter for PostgreSQL |
| Payload CMS | 3.70 | User record management and membership tier | Already integrated, provides admin UI for user management, supports custom auth strategies |
| email-normalize | Latest (npm) | Email canonicalization | Prevents duplicate accounts via Gmail aliases, handles provider-specific normalization rules |
| Drizzle ORM | Current | Database schema for Better Auth tables | Already used for planner database, type-safe, supports PostgreSQL with migrations |
| Resend | Latest | Transactional email delivery | Modern email API, better-auth compatible for magic links, already used in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Stripe SDK | Latest | Webhook signature verification | Already integrated, handles checkout.session.completed events |
| PostgreSQL | 14+ | Shared database for both systems | Both Payload and Drizzle use same PostgreSQL instance |
| Zod | Latest | Email validation schema | Type-safe validation for email normalization and webhook payloads |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Better Auth | NextAuth.js | NextAuth more mature but Better Auth has cleaner API, native Drizzle support, and better TypeScript experience |
| Email normalization library | Custom regex | Libraries handle edge cases (Gmail dots, plus addressing, Microsoft aliases) that custom solutions miss |
| Dual auth systems | Single auth (Payload only) | Payload auth lacks social login plugins and magic link support; would require custom implementation |
| Email as identifier | Stripe customer ID | Email more user-friendly, allows login before first purchase, supports social login email matching |

**Installation:**
```bash
# Already installed in project
bun add better-auth@^1.2.5
bun add @payloadcms/db-postgres@^3.70
bun add stripe

# Add for email normalization
bun add email-normalize

# Add for validation
bun add zod
```

## Architecture Patterns

### Recommended Project Structure
```
packages/
├── planner-auth/              # Better Auth configuration
│   ├── server.ts              # Auth instance, social providers
│   ├── client.ts              # React hooks, session management
│   └── middleware.ts          # NEW: Session enrichment with Payload data
packages/
├── planner-db/                # Drizzle schemas
│   └── schema/
│       ├── auth.ts            # Better Auth tables (existing)
│       └── workspace.ts       # Add membershipTier field to plannerSubscription
apps/web/
├── src/
│   ├── collections/
│   │   └── users.ts           # Payload Users - add membershipTier field
│   ├── lib/
│   │   ├── email-normalize.ts # NEW: Email canonicalization utilities
│   │   └── membership.ts      # NEW: Membership tier resolution logic
│   └── webhooks/
│       └── stripe/
│           └── route.ts       # MODIFY: Add Better Auth account creation
```

### Pattern 1: Email Canonicalization for Account Linking

**What:** Normalize email addresses to prevent duplicate accounts when users sign up with Gmail aliases or different email capitalization.

**When to use:** Before any user creation (Stripe webhook, Better Auth signup) and before email matching queries.

**Example:**
```typescript
// Source: Based on https://github.com/iDoRecall/email-normalize
import emailNormalize from 'email-normalize';

function canonicalizeEmail(email: string): string {
  // Normalizes:
  // - jane.doe+tag@gmail.com -> janedoe@gmail.com
  // - Jane.Doe@gmail.com -> janedoe@gmail.com
  // - john+test@outlook.com -> john@outlook.com
  return emailNormalize(email);
}

// Usage in Stripe webhook
const purchaseEmail = session.customer_email;
const canonicalEmail = canonicalizeEmail(purchaseEmail);

// Check if user exists with canonical email
const existingUser = await db
  .select()
  .from(plannerUser)
  .where(eq(plannerUser.canonicalEmail, canonicalEmail))
  .limit(1);
```

### Pattern 2: Just-In-Time Account Creation via Webhook

**What:** Create Better Auth account automatically when user purchases membership, using Stripe email as source of truth.

**When to use:** In Stripe `checkout.session.completed` webhook handler for membership products.

**Example:**
```typescript
// Source: Stripe webhook best practices from https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks
import { db } from '@poynt/planner-db';
import { plannerUser, plannerAccount } from '@poynt/planner-db/schema';
import { canonicalizeEmail } from '@/lib/email-normalize';

async function handleMembershipPurchase(session: Stripe.Checkout.Session) {
  const email = session.customer_email;
  if (!email) throw new Error('No customer email in session');

  const canonicalEmail = canonicalizeEmail(email);

  // Idempotency: Check if user already exists
  const existing = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.canonicalEmail, canonicalEmail))
    .limit(1);

  if (existing.length > 0) {
    // User exists, just update Payload membership tier
    await updatePayloadMembership(email, session.metadata.tier);
    return existing[0];
  }

  // Create Better Auth user
  const userId = crypto.randomUUID();
  await db.insert(plannerUser).values({
    id: userId,
    email: email,
    canonicalEmail: canonicalEmail,
    name: session.customer_details?.name || email.split('@')[0],
    emailVerified: true, // Stripe confirmed via payment
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create Payload user record with membership tier
  await createPayloadUser({
    email: email,
    membershipTier: session.metadata.tier,
    stripeCustomerId: session.customer,
  });

  // Send magic link welcome email
  await sendWelcomeEmail(email, userId);

  return userId;
}
```

### Pattern 3: Session Enrichment Middleware

**What:** Enrich Better Auth session with Payload membership tier data for authorization checks.

**When to use:** In On Poynt app middleware or tRPC context to resolve user's current membership tier.

**Example:**
```typescript
// Source: Better Auth session management from https://www.better-auth.com/docs/concepts/session-management
import { auth } from '@poynt/planner-auth/server';
import { getPayload } from 'payload';

export async function getSessionWithMembership(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) return null;

  // Enrich with Payload membership data
  const payload = await getPayload({ config });
  const payloadUser = await payload.find({
    collection: 'users',
    where: { email: { equals: session.user.email } },
    limit: 1,
  });

  if (payloadUser.docs.length === 0) {
    throw new Error('User exists in Better Auth but not in Payload');
  }

  return {
    ...session,
    membership: {
      tier: payloadUser.docs[0].membershipTier,
      stripeCustomerId: payloadUser.docs[0].stripeCustomerId,
      // Add other Payload-specific fields
    },
  };
}
```

### Pattern 4: Webhook Idempotency with Event ID Tracking

**What:** Prevent duplicate processing of Stripe webhooks using event ID as idempotency key.

**When to use:** All Stripe webhook handlers to ensure account creation and email sends happen exactly once.

**Example:**
```typescript
// Source: Stripe idempotency best practices from https://docs.stripe.com/webhooks
import { db } from '@poynt/planner-db';
import { plannerWebhookEvent } from '@poynt/planner-db/schema'; // New table

export async function POST(req: NextRequest) {
  const event = await constructStripeEvent(req);

  // Check if event already processed
  const existing = await db
    .select()
    .from(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, event.id))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Event ${event.id} already processed`);
    return NextResponse.json({ received: true }); // Still return 2xx
  }

  try {
    // Process event
    await handleMembershipPurchase(event.data.object);

    // Mark as processed AFTER success
    await db.insert(plannerWebhookEvent).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
      processedAt: new Date(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    // Don't save event ID on failure - allow Stripe to retry
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

### Anti-Patterns to Avoid

- **Using display email without normalization:** Gmail users can create infinite aliases (john+1@gmail.com, john+2@gmail.com). Always canonicalize before storage and matching.
- **Synchronous webhook processing:** Complex operations (sending emails, API calls) should happen in background jobs. Stripe times out webhooks after 30 seconds; return 2xx immediately.
- **Password field on Better Auth users:** Better Auth handles passwords in `plannerAccount` table. Don't add password to `plannerUser` schema—it will conflict.
- **Assuming Payload and Better Auth share user IDs:** They don't. Link via canonical email, not ID foreign keys.
- **Creating accounts before webhook signature validation:** Always verify webhook signature FIRST to prevent malicious account creation.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email normalization | Regex for dots and plus signs | `email-normalize` library | Handles provider-specific rules (Gmail ignores dots, Outlook doesn't), case normalization, subdomain aliases |
| Magic link token generation | UUID + expiry timestamp | Better Auth magic link plugin | Handles token security, expiry, one-time use, rate limiting, email template |
| Webhook signature verification | Manual HMAC-SHA256 | `stripe.webhooks.constructEvent()` | Handles timing attacks, signature version updates, throws on invalid signatures |
| Session persistence | Manual JWT in cookies | Better Auth session management | Handles multi-device sessions, token rotation, CSRF protection, HTTP-only cookies |
| Social login OAuth flow | Custom OAuth implementation | Better Auth social providers | Handles callback URLs, state validation, token exchange, user profile fetching |

**Key insight:** Authentication has many attack vectors (replay attacks, timing attacks, session fixation, CSRF). Libraries like Better Auth have battle-tested implementations. Email normalization has subtle edge cases per provider. Don't reinvent these.

## Common Pitfalls

### Pitfall 1: Email Mismatch Between Purchase and Login

**What goes wrong:** User purchases membership with work email (user@company.com) but signs up with personal Gmail (user@gmail.com). Systems can't link accounts.

**Why it happens:** Stripe checkout captures whatever email customer enters; Better Auth social login uses email from Google/provider. User may use different emails for billing vs. daily use.

**How to avoid:**
1. **Primary strategy:** Send magic link to purchase email immediately after webhook. User clicks link → Better Auth creates account with that email → systems linked.
2. **Fallback:** Admin UI to manually link accounts by searching Stripe customer ID and assigning to Better Auth user.
3. **Detection:** Monitor for Payload users without corresponding Better Auth users (orphaned memberships).

**Warning signs:**
- User complains "I paid but can't log in"
- Payload has user with stripeCustomerId but no matching Better Auth user
- Multiple support tickets about "account not found"

### Pitfall 2: Webhook Race Condition - Purchase Before Account Exists

**What goes wrong:** User purchases membership → Stripe webhook fires → tries to create Payload user → fails because Better Auth user doesn't exist yet → user gets charged but no access.

**Why it happens:** Webhook processing assumes user account already exists, but this is first interaction with system.

**How to avoid:**
1. Create Better Auth account FIRST in webhook handler (just-in-time provisioning)
2. Then create Payload user record with membership tier
3. Use database transaction to ensure both succeed or both rollback
4. Send welcome email with magic link AFTER both accounts created

**Warning signs:**
- Webhook logs show "user not found" errors
- Stripe shows successful payment but user can't log in
- Orphaned Stripe customers without user accounts

### Pitfall 3: Password Hashing Incompatibility

**What goes wrong:** If attempting to migrate users from Payload auth to Better Auth, password hashes may be incompatible (Payload uses bcrypt, Better Auth expects bcrypt in `plannerAccount.password`).

**Why it happens:** Different auth systems store passwords differently. Better Auth uses `account` table with provider-specific credentials.

**How to avoid:**
1. **Recommended:** Don't migrate passwords. Use passwordless flow (magic links) for all users.
2. **If migration needed:** Verify Better Auth's bcrypt implementation matches Payload's cost factor (work factor 10-13).
3. Force password reset on migration: send magic link, user sets new password in Better Auth.

**Warning signs:**
- Users report "password doesn't work" after migration
- Better Auth login fails with valid Payload credentials
- Hash verification errors in logs

### Pitfall 4: Multi-Device Session Revocation Issues

**What goes wrong:** User downgrades membership tier but remains logged in on other devices with old tier until session expires.

**Why it happens:** Better Auth uses cookie caching by default—session data cached in short-lived signed cookie. Tier changes in Payload don't invalidate existing session cookies.

**How to avoid:**
1. Set short `updateAge` in Better Auth session config (e.g., 1 hour) to force frequent revalidation
2. On tier change, use Better Auth's `revokeOtherSessions` to force logout on all devices
3. Middleware checks Payload tier on EVERY request to AI tools (don't rely on cached session)

**Warning signs:**
- User reports "I downgraded but can still access premium features"
- Session tier differs from Payload tier for same user
- Tier changes take hours to propagate

### Pitfall 5: Duplicate Webhook Processing

**What goes wrong:** Stripe sends same `checkout.session.completed` event twice → creates duplicate accounts → sends duplicate welcome emails.

**Why it happens:** Network timeouts, Stripe retries, server restarts during processing.

**How to avoid:**
1. Track processed event IDs in database (`plannerWebhookEvent` table)
2. Check if event already processed BEFORE any operations
3. Return 2xx even if duplicate (tells Stripe to stop retrying)
4. Use unique constraints on canonical email to prevent duplicate user creation

**Warning signs:**
- Users receive multiple welcome emails
- Database has duplicate user records with same email
- Webhook logs show same event ID processed multiple times

## Code Examples

Verified patterns from official sources:

### Better Auth Configuration with Google Social Login and Magic Link

```typescript
// Source: https://www.better-auth.com/docs/authentication/google
// Source: https://www.better-auth.com/docs/plugins/magic-link
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@poynt/planner-db";
import * as schema from "@poynt/planner-db/schema";

export const auth = betterAuth({
  appName: "On Poynt",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/on-poynt/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.plannerUser,
      session: schema.plannerSession,
      account: schema.plannerAccount,
      verification: schema.plannerVerification,
    },
  }),

  // Social providers
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Redirect URI: http://localhost:3000/on-poynt/api/auth/callback/google
    },
  },

  // Email/password disabled - only social and magic link
  emailAndPassword: {
    enabled: false,
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // Revalidate every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60, // 1 hour cache
    },
  },

  // Plugins
  plugins: [
    magicLink({
      // Send magic link via Resend
      sendMagicLink: async ({ email, url, token }) => {
        await resend.emails.send({
          from: "On Poynt <onboarding@poynt.no>",
          to: email,
          subject: "Logg inn på On Poynt",
          html: `<p>Klikk på lenken for å logge inn: <a href="${url}">Logg inn</a></p>`,
        });
      },
      // Token expires in 10 minutes
      expiresIn: 60 * 10,
    }),
  ],
});
```

### Client-Side Social Login

```typescript
// Source: https://www.better-auth.com/docs/authentication/google
import { authClient } from '@poynt/planner-auth/client';

export function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/on-poynt/oversikt', // Redirect after login
    });
  };

  return <button onClick={handleGoogleLogin}>Logg inn med Google</button>;
}
```

### Membership Tier Field in Payload Users

```typescript
// Source: Payload CMS field types documentation
import type { CollectionConfig } from 'payload';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    // Existing fields...
    {
      name: 'membershipTier',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: [
        { label: 'Ingen medlemskap', value: 'none' },
        { label: 'Community', value: 'community' },
        { label: 'Community + AI', value: 'community_ai' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Brukernes medlemskapsnivå',
      },
    },
    {
      name: 'membershipStatus',
      type: 'select',
      defaultValue: 'inactive',
      options: [
        { label: 'Aktiv', value: 'active' },
        { label: 'Inaktiv', value: 'inactive' },
        { label: 'Kansellert', value: 'canceled' },
        { label: 'Forfalt', value: 'past_due' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'stripeCustomerId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stripeSubscriptionId',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
};
```

### Email Normalization Utility

```typescript
// Source: Based on https://github.com/iDoRecall/email-normalize
import emailNormalize from 'email-normalize';
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email()
  .transform((email) => canonicalizeEmail(email));

export function canonicalizeEmail(email: string): string {
  try {
    // Library handles:
    // - Gmail: removes dots, strips +tags
    // - Outlook/Live: strips +tags
    // - Yahoo: strips +tags
    // - Lowercase normalization
    return emailNormalize(email);
  } catch (error) {
    // Fallback for invalid emails
    return email.toLowerCase().trim();
  }
}

// Usage examples:
// canonicalizeEmail('Jane.Doe+test@gmail.com') => 'janedoe@gmail.com'
// canonicalizeEmail('John+work@outlook.com') => 'john@outlook.com'
// canonicalizeEmail('MARY@YAHOO.COM') => 'mary@yahoo.com'
```

### Drizzle Schema Addition for Canonical Email

```typescript
// Add to packages/planner-db/schema/auth.ts
export const plannerUser = pgTable("planner_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  canonicalEmail: text("canonical_email").notNull(), // NEW
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").$type<UserRole>().default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Add index for canonical email lookups
// In migration file:
CREATE INDEX planner_user_canonical_email_idx ON planner_user(canonical_email);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Passport.js for auth | Better Auth / Auth.js | 2024-2025 | Modern libraries offer better TypeScript support, passwordless flows, and simpler configuration |
| Custom OAuth implementation | Better Auth social providers | 2024 | Reduces security risks, handles edge cases (state validation, token refresh) |
| JWT in localStorage | HTTP-only cookies with session | 2023-2024 | Prevents XSS attacks, supports multi-device management |
| Manual email validation | Email normalization libraries | 2022-2023 | Prevents duplicate accounts via provider-specific aliasing rules |
| Payload v2 auth strategies | Payload v3 custom auth | 2024 | v3 removed Passport dependency, requires manual strategy implementation |

**Deprecated/outdated:**
- Passport.js strategies in Payload: Removed in v3, use custom auth strategies or keep Payload auth separate
- NextAuth.js name: Rebranded to Auth.js (same library, new name as of 2024)
- Synchronous webhook processing: Now considered anti-pattern; use background jobs for complex operations

## Open Questions

Things that couldn't be fully resolved:

1. **Password Hashing Between Systems**
   - What we know: Payload uses bcrypt for auth.password field, Better Auth uses bcrypt in plannerAccount.password
   - What's unclear: Exact bcrypt cost factor compatibility, whether existing Payload user passwords can be migrated
   - Recommendation: Validate during Phase 1 implementation by testing password verification. If incompatible, force all users to passwordless flow (magic links). Add to CONTEXT.md decision.

2. **Payload Auth Completely Disabled?**
   - What we know: Payload CMS admin requires auth on Users collection, but we want Better Auth for On Poynt
   - What's unclear: Can we keep Payload auth for CMS admin only while using Better Auth for On Poynt members?
   - Recommendation: Yes—maintain separate auth domains. Payload auth for admin panel (/admin), Better Auth for On Poynt (/on-poynt). Admin users and members are different user sets. Document in implementation plan.

3. **Session Sharing Between Domains**
   - What we know: Better Auth sessions use HTTP-only cookies, scoped to domain
   - What's unclear: If poynt.no (main site) and on-poynt subdomain share cookies, or if session needs manual propagation
   - Recommendation: Test cookie sharing with same-site configuration. If needed, implement separate sessions (main site uses Payload auth, On Poynt uses Better Auth). Most likely: no sharing needed—On Poynt is separate authenticated area.

4. **Grace Period After Subscription Cancellation**
   - What we know: Stripe supports cancel_at_period_end for access until end of billing period
   - What's unclear: How to handle in middleware—check Stripe API on every request, or cache period_end in Payload?
   - Recommendation: Cache currentPeriodEnd in Payload Users on webhook update. Middleware checks: if status=canceled AND currentPeriodEnd > now(), allow access. Avoids Stripe API call on every request. Phase 1 sets up the field, Phase 6 implements the logic.

5. **Magic Link Rate Limiting**
   - What we know: Better Auth magic link plugin supports rate limiting
   - What's unclear: Default limits, configuration options, per-IP vs per-email
   - Recommendation: Check Better Auth docs during implementation. Likely defaults are reasonable (e.g., 5 magic links per email per hour). Can configure if abuse detected. Low priority for Phase 1.

## Sources

### Primary (HIGH confidence)
- [Better Auth Documentation](https://www.better-auth.com/docs/introduction) - Core library features, session management, social providers
- [Better Auth Magic Link Plugin](https://www.better-auth.com/docs/plugins/magic-link) - Magic link authentication implementation
- [Better Auth Google Provider](https://www.better-auth.com/docs/authentication/google) - Google social login configuration
- [Better Auth Session Management](https://www.better-auth.com/docs/concepts/session-management) - Multi-device session handling
- [Better Auth Multi-Session Plugin](https://www.better-auth.com/docs/plugins/multi-session) - Concurrent session management
- [Payload CMS Authentication Overview](https://payloadcms.com/docs/authentication/overview) - Built-in auth features
- [Payload CMS Custom Strategies](https://payloadcms.com/docs/authentication/custom-strategies) - External auth integration patterns
- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) - Webhook signature verification, event types
- [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests) - Preventing duplicate processing

### Secondary (MEDIUM confidence)
- [Email Normalization Guide - UserCheck](https://www.usercheck.com/guides/how-to-normalize-email-addresses) - Preventing duplicate accounts via canonical emails
- [email-normalize library](https://github.com/iDoRecall/email-normalize) - Provider-specific normalization rules
- [Stripe Webhooks Best Practices - Stigg](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) - Idempotency, error handling, retry logic
- [Better Auth vs NextAuth Comparison - BetterStack](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/) - Library comparison and selection criteria
- [Password Hashing Guide 2025 - Bcrypt vs Argon2](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) - Hashing algorithm compatibility
- [Auth0 Account Linking](https://auth0.com/docs/manage-users/user-accounts/user-account-linking) - Cross-system user linking patterns
- [Better Auth + Payload CMS Integration](https://medium.com/@martinddesigns/how-to-add-custom-authentication-in-payload-cms-using-better-auth-95df1366c313) - Community implementation example

### Tertiary (LOW confidence)
- [PostgreSQL Synchronous Replication](https://hevodata.com/learn/postgresql-sync-replication/) - Database sync patterns (not directly applicable, single DB instance)
- [Webhook Idempotency Implementation - Hookdeck](https://hookdeck.com/webhooks/guides/implement-webhook-idempotency) - General webhook patterns
- [Resend Email Documentation](https://resend.com) - Email delivery service (low detail from search)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Better Auth, Payload, Stripe are all officially documented and battle-tested
- Architecture: MEDIUM - Patterns are sound but specific to this dual-auth use case, not widely documented as a single approach
- Pitfalls: MEDIUM - Based on common auth system issues and Stripe webhook experiences, not all specific to Better Auth + Payload combo
- Email normalization: HIGH - Well-documented problem with mature library solutions
- Session management: HIGH - Better Auth docs are comprehensive on multi-session and persistence

**Research date:** 2026-02-04
**Valid until:** ~30 days (libraries stable, patterns unlikely to change rapidly)

**Key unknowns requiring validation during implementation:**
1. Password hashing compatibility between Payload bcrypt and Better Auth bcrypt
2. Cookie sharing behavior between main site and On Poynt subdomain
3. Better Auth magic link default rate limits
4. Performance of Payload query in session enrichment middleware (may need caching)
