# Phase 2: Membership Products & Purchase Flow - Research

**Researched:** 2026-02-15
**Domain:** Stripe subscription billing, membership product configuration, checkout flows, webhook lifecycle management, post-purchase onboarding
**Confidence:** HIGH

## Summary

Phase 2 requires implementing end-to-end membership purchase flow with configurable billing periods (1, 3, 6, 12 months), Stripe subscription management, post-purchase onboarding, and subscription lifecycle webhooks. The phase builds on Phase 1's auth foundation where Payload CMS is the source of truth for membership tier/status and Better Auth handles authentication.

The standard approach is to create a single Stripe Product for membership with multiple recurring Prices (one per billing interval using `interval_count`), use Stripe Checkout in `mode=subscription` for purchase flow, handle subscription lifecycle via webhooks (`customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`), integrate Stripe Customer Portal for self-service subscription management, and implement a lightweight React-based onboarding wizard after purchase completion.

Key technical challenges include: (1) Cart separation - membership products cannot mix with digital products in same checkout session (requires separate flows), (2) Price configuration - need 4 distinct Prices with correct `interval_count` values attached to single Product, (3) Webhook idempotency - must prevent duplicate processing using event ID tracking (already implemented in Phase 1), (4) Subscription status sync - webhooks must update both Payload Users collection and Better Auth planner_subscription table, (5) Onboarding flow - trigger after successful payment with redirect to multi-step wizard.

**Primary recommendation:** Extend existing Products collection with `productType` field (digital vs membership), create 4 Stripe Prices for membership product programmatically with `interval_count` of 1, 3, 6, 12 months, implement dedicated checkout route that bypasses cart for membership purchases, expand webhook handler to process all subscription lifecycle events, build Customer Portal integration for subscription management, and create React-based onboarding flow using existing patterns from `/on-poynt/onboarding`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Stripe API | 10.17.0+ | Subscription billing with recurring prices | Industry standard for subscription management, supports `interval_count` for flexible billing periods, comprehensive webhook events |
| @payloadcms/plugin-stripe | 3.70+ | Product-to-Stripe sync | Already integrated, handles product sync but NOT price creation (manual control needed) |
| Payload CMS | 3.70 | Membership tier storage | Single source of truth established in Phase 1, stores `membershipTier`, `membershipStatus`, `stripeSubscriptionId` |
| Resend | Latest | Transactional email | Already integrated, welcome email function exists (`sendWelcomeEmail`) |
| React Email | Latest | Email templates | Modern email component library, integrates with Resend, supports TypeScript and hot reload |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Drizzle ORM | Current | planner_subscription table updates | Update subscription records in Better Auth database alongside Payload |
| Zod | Latest | Webhook payload validation | Type-safe validation for subscription metadata and customer data |
| next-safe-action | Latest | Server action validation | Type-safe server actions for checkout flow and onboarding |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Multiple Prices per Product | Subscription Schedules | Schedules add complexity; multiple Prices cleaner for fixed intervals |
| Dedicated membership checkout | Mixed cart (subscription + payment mode) | Stripe supports mixed carts BUT simpler UX to separate flows, avoid confusion |
| React onboarding wizard | Onborda/NextStepjs libraries | Libraries overkill for simple 2-3 step wizard; custom solution sufficient |
| Manual Price creation | Payload plugin auto-sync | Plugin syncs Products but NOT Prices with `interval_count`; manual control required |

**Installation:**
```bash
# Already installed
bun add stripe@^10.17.0
bun add @payloadcms/plugin-stripe@^3.70
bun add resend
bun add zod

# Add for enhanced validation (optional)
bun add next-safe-action
```

## Architecture Patterns

### Recommended Project Structure
```
apps/web/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   ├── membership/route.ts    # NEW: Dedicated membership checkout
│   │   │   └── products/route.ts      # Existing digital products checkout
│   │   └── webhooks/
│   │       └── stripe/route.ts        # EXTEND: Add subscription event handlers
│   ├── (marketing)/
│   │   └── medlemskap/
│   │       ├── page.tsx               # NEW: Membership product page with pricing tiers
│   │       └── bekreftelse/page.tsx   # NEW: Post-purchase confirmation
│   └── (on-poynt)/
│       └── on-poynt/
│           └── onboarding/
│               └── page.tsx           # EXTEND: Multi-step onboarding wizard
├── src/
│   ├── collections/
│   │   └── products.ts                # EXTEND: Add productType field
│   └── lib/
│       ├── stripe/
│       │   ├── create-membership-prices.ts  # NEW: Price creation script
│       │   └── customer-portal.ts           # NEW: Portal session creation
│       └── membership/
│           └── sync-subscription.ts         # NEW: Sync to Payload + Drizzle
packages/
├── email/
│   ├── templates/
│   │   ├── welcome-member.tsx         # NEW: React Email welcome template
│   │   └── subscription-updated.tsx   # NEW: Plan change notification
│   └── index.ts                       # EXTEND: Export new email functions
```

### Pattern 1: Membership Product with Multiple Billing Periods

**What:** Single Stripe Product with 4 separate recurring Prices for different billing intervals.

**When to use:** Offering flexible billing options to customers (1, 3, 6, 12 months) while maintaining single product identity.

**Example:**
```typescript
// Source: https://docs.stripe.com/api/prices/create
import { getStripe } from '@poynt/stripe';

async function createMembershipPrices(productId: string) {
  const stripe = getStripe();

  const pricingConfig = [
    { months: 1, amount: 99900, label: '1 måned' },   // 999 NOK/month
    { months: 3, amount: 269700, label: '3 måneder' }, // 899 NOK/month (10% off)
    { months: 6, amount: 509400, label: '6 måneder' }, // 849 NOK/month (15% off)
    { months: 12, amount: 959400, label: '12 måneder' }, // 799 NOK/month (20% off)
  ];

  const prices = await Promise.all(
    pricingConfig.map(({ months, amount, label }) =>
      stripe.prices.create({
        product: productId,
        currency: 'nok',
        unit_amount: amount,
        recurring: {
          interval: 'month',
          interval_count: months,
        },
        metadata: {
          billingPeriodLabel: label,
          tierName: 'Community',
        },
      })
    )
  );

  return prices;
}
```

**Why this pattern:** Stripe supports `interval_count` up to 12 for months, allowing quarterly/semi-annual/annual billing without Subscription Schedules complexity. Customers see all options at purchase time.

### Pattern 2: Dedicated Membership Checkout Flow

**What:** Separate API route for membership purchases that bypasses cart and creates subscription-mode Checkout Session.

**When to use:** When selling subscriptions separately from one-time digital products.

**Example:**
```typescript
// Source: Adapted from https://docs.stripe.com/billing/subscriptions/build-subscriptions
// apps/web/app/api/checkout/membership/route.ts
import { getStripe } from '@poynt/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { priceId, email, tier } = await req.json();

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', // CRITICAL: Use subscription mode
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId, // One of the 4 membership prices
        quantity: 1,
      },
    ],
    customer_email: email,
    metadata: {
      productType: 'membership',
      tier: tier, // 'community' or 'community_ai'
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap/bekreftelse?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap`,
    subscription_data: {
      metadata: {
        tier: tier,
      },
    },
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
```

**Why separate flow:** Stripe Checkout `mode` parameter cannot be mixed - either `payment` (one-time) or `subscription` (recurring). While you CAN mix line items within subscription mode, simpler UX keeps flows separate.

### Pattern 3: Subscription Lifecycle Webhook Handlers

**What:** Comprehensive event handlers for subscription creation, updates, cancellation, and payment events.

**When to use:** Required for subscription billing - webhooks are asynchronous and MUST update both Payload and Drizzle databases.

**Example:**
```typescript
// Source: https://docs.stripe.com/billing/subscriptions/webhooks
// apps/web/app/api/webhooks/stripe/route.ts (EXTEND existing handler)

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  // Get customer email from Stripe
  const customer = await stripe.customers.retrieve(customerId);
  const email = (customer as Stripe.Customer).email;

  if (!email) throw new Error('No email found for customer');

  const tier = subscription.metadata.tier as 'community' | 'community_ai';

  // Update Payload Users collection
  const payload = await getPayload({ config });
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  });

  if (users.docs.length > 0) {
    await payload.update({
      collection: 'users',
      id: users.docs[0].id,
      data: {
        membershipTier: tier,
        membershipStatus: 'active',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
      },
    });
  }

  // Update planner_subscription in Drizzle
  const canonical = canonicalizeEmail(email);
  const [user] = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.canonicalEmail, canonical))
    .limit(1);

  if (user) {
    await db.insert(plannerSubscription).values({
      id: crypto.randomUUID(),
      userId: user.id,
      tier: tier === 'community_ai' ? 'pro' : 'free', // Map to planner tiers
      status: 'active',
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: false,
    }).onConflictDoUpdate({
      target: plannerSubscription.userId,
      set: {
        tier: tier === 'community_ai' ? 'pro' : 'free',
        status: 'active',
        stripeSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle plan upgrades, downgrades, status changes
  // Similar pattern to handleSubscriptionCreated
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Revoke access - set membershipStatus to 'canceled'
  // Update both Payload and Drizzle
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Update subscription period dates
  // Send receipt email
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update status to 'past_due'
  // Send payment failure notification
}

// In main webhook POST handler:
switch (event.type) {
  case 'customer.subscription.created':
    await handleSubscriptionCreated(event.data.object);
    break;
  case 'customer.subscription.updated':
    await handleSubscriptionUpdated(event.data.object);
    break;
  case 'customer.subscription.deleted':
    await handleSubscriptionDeleted(event.data.object);
    break;
  case 'invoice.paid':
    await handleInvoicePaid(event.data.object);
    break;
  case 'invoice.payment_failed':
    await handleInvoicePaymentFailed(event.data.object);
    break;
  case 'checkout.session.completed':
    // Existing handler remains for digital products
    break;
}
```

**Why comprehensive handlers:** Subscription lifecycle is complex - Stripe handles renewals, payment failures, upgrades, downgrades asynchronously. Your app MUST stay in sync via webhooks.

### Pattern 4: Stripe Customer Portal Integration

**What:** Pre-built Stripe-hosted page for subscription management (upgrade, downgrade, cancel, update payment).

**When to use:** Required for self-service subscription management. Stripe Customer Portal provides secure, PCI-compliant interface.

**Example:**
```typescript
// Source: https://docs.stripe.com/customer-management/integrate-customer-portal
// apps/web/app/api/customer-portal/route.ts
import { getStripe } from '@poynt/stripe';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { customerId } = await req.json();

  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/on-poynt/innstillinger/medlemskap`,
  });

  return NextResponse.json({ url: session.url });
}
```

**Configuration in Stripe Dashboard:**
- Enable subscription updates (upgrade/downgrade)
- Enable cancellation (immediate or at period end)
- Enable payment method updates
- Configure available products (membership tiers)
- Limit to 10 product choices (Stripe restriction)

**Why use Portal:** Building subscription management UI from scratch requires handling payment method updates, PCI compliance, plan changes with proration, cancellation flows. Portal provides this out-of-box.

### Pattern 5: React Email Welcome Template

**What:** Type-safe React-based email template for welcome emails with brand consistency.

**When to use:** Post-purchase welcome email with onboarding link and account details.

**Example:**
```typescript
// Source: https://react.email/components
// packages/email/templates/welcome-member.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeMemberEmailProps {
  memberName: string;
  tier: 'Community' | 'Community + AI';
  onboardingUrl: string;
}

export default function WelcomeMemberEmail({
  memberName,
  tier,
  onboardingUrl,
}: WelcomeMemberEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Velkommen til On Poynt - din markedsføringsplanlegger</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Velkommen til On Poynt!</Heading>

          <Text style={text}>
            Hei {memberName},
          </Text>

          <Text style={text}>
            Takk for at du ble {tier}-medlem! Du har nå tilgang til On Poynt-plattformen
            med verktøy for markedsføringsplanlegging.
          </Text>

          <Section style={buttonContainer}>
            <Button href={onboardingUrl} style={button}>
              Kom i gang
            </Button>
          </Section>

          <Text style={footer}>
            Lenken utløper om 24 timer. Hvis du har spørsmål, svar på denne e-posten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { margin: '0 auto', padding: '20px 0 48px', maxWidth: '580px' };
const h1 = { color: '#1e293b', fontSize: '24px', fontWeight: 'bold' };
const text = { color: '#475569', fontSize: '16px', lineHeight: '24px' };
const buttonContainer = { padding: '27px 0' };
const button = {
  backgroundColor: '#2563eb',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};
const footer = { color: '#64748b', fontSize: '12px' };
```

**Usage in webhook handler:**
```typescript
import { render } from '@react-email/render';
import { sendWelcomeEmail } from '@poynt/email';
import WelcomeMemberEmail from '@poynt/email/templates/welcome-member';

const emailHtml = render(
  WelcomeMemberEmail({
    memberName: session.customer_details?.name || 'there',
    tier: tier === 'community_ai' ? 'Community + AI' : 'Community',
    onboardingUrl: `${process.env.NEXT_PUBLIC_URL}/on-poynt/onboarding`,
  })
);

await getResend().emails.send({
  from: 'On Poynt <velkommen@poynt.no>',
  to: email,
  subject: 'Velkommen til On Poynt!',
  html: emailHtml,
});
```

### Pattern 6: Lightweight Multi-Step Onboarding

**What:** Simple wizard collecting workspace name, industry, and tour of features. No external library.

**When to use:** Post-purchase onboarding to improve activation and engagement.

**Example:**
```typescript
// Source: Existing pattern in apps/web/app/(on-poynt)/on-poynt/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'workspace' | 'profile' | 'tour';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('workspace');
  const [data, setData] = useState({
    workspaceName: '',
    industry: '',
    companySize: '',
  });

  const handleComplete = async () => {
    // Call server action to save onboarding data
    await fetch('/api/onboarding/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    router.push('/on-poynt/oversikt');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress indicator */}
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 flex gap-2">
          {['workspace', 'profile', 'tour'].map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded ${
                i <= ['workspace', 'profile', 'tour'].indexOf(step)
                  ? 'bg-blue-600'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        {step === 'workspace' && (
          <WorkspaceStep
            value={data.workspaceName}
            onChange={(name) => setData({ ...data, workspaceName: name })}
            onNext={() => setStep('profile')}
          />
        )}

        {step === 'profile' && (
          <ProfileStep
            data={data}
            onChange={(updates) => setData({ ...data, ...updates })}
            onNext={() => setStep('tour')}
            onBack={() => setStep('workspace')}
          />
        )}

        {step === 'tour' && (
          <TourStep
            onComplete={handleComplete}
            onBack={() => setStep('profile')}
          />
        )}
      </div>
    </div>
  );
}
```

**Why simple pattern:** External onboarding libraries (Onborda, NextStepjs) add complexity for basic wizard. Custom solution with useState + conditional rendering sufficient for 2-3 step flow.

### Anti-Patterns to Avoid

- **Mixed Cart:** Don't try to sell memberships and digital products in same checkout session. Separate flows prevent confusion and simplify webhook handling.

- **Price Sync via Plugin:** Don't rely on @payloadcms/plugin-stripe to create Prices with `interval_count`. Plugin syncs Products only. Create Prices programmatically with specific recurring config.

- **Missing Webhook Events:** Don't only handle `checkout.session.completed`. Subscriptions require `customer.subscription.*` and `invoice.*` events for full lifecycle management.

- **Synchronous Subscription Creation:** Don't create subscription directly in checkout API route. Always use Stripe Checkout + webhook flow for proper event tracking and idempotency.

- **Payload-Only Sync:** Don't update only Payload Users collection. Must also update planner_subscription table in Drizzle for Better Auth session enrichment.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Subscription management UI | Custom dashboard with plan changes, cancellation, payment updates | Stripe Customer Portal | PCI compliance, proration logic, payment method updates, secure customer authentication, localization built-in |
| Email templates | String concatenation HTML | React Email + Resend | Type safety, component reusability, responsive design, dark mode support, preview environment |
| Webhook signature verification | Manual HMAC validation | stripe.webhooks.constructEvent() | Handles signature verification, timestamp validation, prevents replay attacks |
| Proration calculations | Manual price math for upgrades | Stripe automatic proration | Stripe calculates prorated charges/credits automatically when changing subscriptions |
| Payment retry logic | Custom retry scheduler | Stripe Smart Retries | Stripe automatically retries failed payments 4 times over 3 weeks with customizable schedule |

**Key insight:** Subscription billing has many edge cases - payment failures, dunning management, proration, plan changes, tax handling. Stripe solves these; don't rebuild.

## Common Pitfalls

### Pitfall 1: Cart Contamination (Membership + Digital Products)

**What goes wrong:** Attempting to add membership subscription to existing cart with digital products results in checkout mode conflict (`payment` vs `subscription`).

**Why it happens:** Stripe Checkout `mode` parameter is mutually exclusive. Digital products use `mode=payment` (one-time), memberships use `mode=subscription` (recurring). Cannot mix.

**How to avoid:**
- Check cart contents before allowing membership product to be added
- Display clear message: "Medlemskap må kjøpes separat. Fullfør nåværende handlevogn først."
- Provide "Kjøp medlemskap" button that bypasses cart entirely
- Alternatively: Allow mixed cart in subscription mode by converting digital products to one-time line items, but this complicates UX

**Warning signs:**
- Stripe API error: "line_items[0].price cannot be used with mode=payment"
- Cart shows both one-time and recurring items
- Checkout flow doesn't load

**Validation needed:**
```typescript
// In cart store or checkout flow
function canAddMembership(cart: CartItem[]): boolean {
  return cart.length === 0; // Only allow membership in empty cart
}

// Or implement cart clearing
function replaceMembership(cart: CartItem[], membershipPriceId: string): void {
  // Clear cart, add membership as single item
  clearCart();
  // Don't use cart for membership - redirect to dedicated flow
  router.push(`/medlemskap/checkout?price=${membershipPriceId}`);
}
```

### Pitfall 2: Webhook Idempotency Gaps

**What goes wrong:** Despite event ID tracking (implemented in Phase 1), subscription updates processed multiple times due to rapid-fire events during plan changes.

**Why it happens:** Stripe may send multiple related events in quick succession (e.g., `customer.subscription.updated` multiple times during upgrade). Event IDs are unique, but each event SHOULD be processed even if similar.

**How to avoid:**
- Continue using event ID deduplication (prevents exact replays)
- Add operation idempotency within handlers using combination of event type + subscription ID + timestamp
- Use database transactions for Payload + Drizzle updates to ensure consistency
- Return 200 immediately after validation, process asynchronously with job queue if complex

**Warning signs:**
- Duplicate subscription records in planner_subscription table
- Membership tier flips between values rapidly
- Multiple welcome emails sent

**Enhanced validation:**
```typescript
// Extend existing webhook event table with operation tracking
async function isOperationProcessed(
  eventId: string,
  operationType: string,
  resourceId: string
): Promise<boolean> {
  const key = `${eventId}:${operationType}:${resourceId}`;

  const existing = await db
    .select()
    .from(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, key))
    .limit(1);

  return existing.length > 0;
}

// In subscription handler
if (await isOperationProcessed(event.id, 'sub_update', subscription.id)) {
  return NextResponse.json({ received: true });
}
```

### Pitfall 3: Subscription Status Drift

**What goes wrong:** Payload Users collection shows `membershipStatus: 'active'` but Drizzle planner_subscription shows `status: 'past_due'`, causing access inconsistencies.

**Why it happens:** Webhook handlers update databases in sequence, not atomically. If Payload update succeeds but Drizzle update fails, status diverges.

**How to avoid:**
- Use database transactions where possible
- If cross-database transaction not feasible, implement compensating logic:
  - Update both databases
  - On failure, log to error tracking
  - Implement daily reconciliation job that queries Stripe API and syncs both databases
- Prefer reading from single source: Payload as source of truth, enrich Better Auth session with Payload data

**Warning signs:**
- User sees "Active" in Payload admin but cannot access tools
- Payment failure emails not sent despite subscription in past_due status
- Subscription cancellation not reflected in Better Auth session

**Reconciliation pattern:**
```typescript
// Daily cron job: apps/web/app/api/cron/sync-subscriptions/route.ts
export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = await getPayload({ config });

  // Get all users with active subscriptions
  const users = await payload.find({
    collection: 'users',
    where: {
      stripeSubscriptionId: { exists: true },
    },
  });

  for (const user of users.docs) {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    // Sync Payload
    if (subscription.status !== user.membershipStatus) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { membershipStatus: subscription.status },
      });
    }

    // Sync Drizzle
    const [plannerUser] = await db
      .select()
      .from(plannerSubscription)
      .where(eq(plannerSubscription.stripeSubscriptionId, subscription.id))
      .limit(1);

    if (plannerUser && plannerUser.status !== subscription.status) {
      await db
        .update(plannerSubscription)
        .set({ status: subscription.status })
        .where(eq(plannerSubscription.id, plannerUser.id));
    }
  }

  return NextResponse.json({ synced: users.docs.length });
}
```

### Pitfall 4: Onboarding Drop-Off

**What goes wrong:** Users complete purchase but never finish onboarding, resulting in low activation rate and early churn.

**Why it happens:** Redirect from Stripe Checkout to generic dashboard without clear next steps. Users don't know where to start.

**How to avoid:**
- Redirect Stripe Checkout `success_url` to dedicated onboarding flow, not dashboard
- Make onboarding mandatory (block access to tools until complete)
- Keep wizard short: 2-3 steps maximum (workspace name, industry, quick tour)
- Show progress bar and completion percentage
- Allow skip for power users (with CTA to complete later)
- Track onboarding completion in database, use for email follow-ups

**Warning signs:**
- High purchase-to-activation gap in analytics
- Support tickets: "I paid but don't know how to use it"
- Low feature adoption in first 7 days

**Implementation:**
```typescript
// Add onboarding completion field to Payload Users
{
  name: 'onboardingCompleted',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    position: 'sidebar',
  },
}

// Middleware in /on-poynt layout
export default function OnPoyntLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session) {
    redirect('/on-poynt/innlogging');
  }

  // Check onboarding status
  const payload = await getPayload({ config });
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: session.user.email } },
    limit: 1,
  });

  const user = users.docs[0];
  if (!user.onboardingCompleted) {
    redirect('/on-poynt/onboarding');
  }

  return <>{children}</>;
}
```

### Pitfall 5: Missing Price Metadata

**What goes wrong:** Customer subscribed successfully, but webhook cannot determine which membership tier (Community vs Community + AI) to provision.

**Why it happens:** Price metadata not set during price creation, or metadata not passed through Checkout Session to webhook.

**How to avoid:**
- Set metadata on Price creation: `metadata: { tier: 'community', billingPeriodLabel: '12 måneder' }`
- Set metadata on Checkout Session: `subscription_data: { metadata: { tier: 'community_ai' } }`
- Retrieve metadata in webhook: `subscription.metadata.tier || subscription.items.data[0].price.metadata.tier`
- Fallback logic: Default to 'community' if missing, log warning

**Warning signs:**
- Webhook logs: "Cannot determine membership tier"
- All new members provisioned with same tier regardless of purchase
- Upgrade/downgrade functionality broken

**Robust metadata access:**
```typescript
function getTierFromSubscription(subscription: Stripe.Subscription): MembershipTier {
  // Priority order: subscription metadata > price metadata > default
  let tier = subscription.metadata?.tier;

  if (!tier && subscription.items.data.length > 0) {
    tier = subscription.items.data[0].price.metadata?.tier;
  }

  if (!tier) {
    console.warn(`No tier metadata found for subscription ${subscription.id}, defaulting to 'community'`);
    tier = 'community';
  }

  return tier as MembershipTier;
}
```

## Code Examples

Verified patterns from official sources:

### Creating Subscription Checkout Session
```typescript
// Source: https://docs.stripe.com/billing/subscriptions/build-subscriptions
import { getStripe } from '@poynt/stripe';

export async function POST(req: NextRequest) {
  const { priceId, email, tier } = await req.json();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { productType: 'membership', tier },
    success_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap/bekreftelse?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap`,
    subscription_data: { metadata: { tier } },
  });

  return NextResponse.json({ url: session.url });
}
```

### Customer Portal Session Creation
```typescript
// Source: https://docs.stripe.com/customer-management/integrate-customer-portal
export async function POST(req: NextRequest) {
  const { customerId } = await req.json();
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/on-poynt/innstillinger/medlemskap`,
  });

  return NextResponse.json({ url: session.url });
}
```

### Webhook Event Processing with Idempotency
```typescript
// Source: https://docs.stripe.com/webhooks
// Existing pattern from Phase 1 route.ts
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check (Phase 1 implementation)
  const existingEvent = await db
    .select()
    .from(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, event.id))
    .limit(1);

  if (existingEvent.length > 0) {
    return NextResponse.json({ received: true });
  }

  // Route to appropriate handler
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    // ... other cases
  }

  // Record processing
  await db.insert(plannerWebhookEvent).values({
    id: crypto.randomUUID(),
    eventId: event.id,
    type: event.type,
  });

  return NextResponse.json({ received: true });
}
```

### React Email Template Rendering
```typescript
// Source: https://react.email/docs/utilities/render
import { render } from '@react-email/render';
import WelcomeMemberEmail from '@poynt/email/templates/welcome-member';
import { getResend } from '@poynt/email';

const emailHtml = render(
  WelcomeMemberEmail({
    memberName: 'Jane Doe',
    tier: 'Community + AI',
    onboardingUrl: 'https://poynt.no/on-poynt/onboarding',
  })
);

await getResend().emails.send({
  from: 'On Poynt <velkommen@poynt.no>',
  to: 'jane@example.com',
  subject: 'Velkommen til On Poynt!',
  html: emailHtml,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single billing interval per product | Multiple Prices with `interval_count` per Product | Always supported | Simpler product catalog, customer chooses interval at checkout |
| Custom subscription UI | Stripe Customer Portal | Customer Portal GA 2020 | Significantly reduces development time, PCI compliance out-of-box |
| String-based email templates | React Email components | React Email v1.0 Jan 2023 | Type safety, component reusability, preview environment |
| Plans resource (deprecated) | Prices resource | Stripe API 2020-08-27 | Prices more flexible, support one-time + recurring, metadata |
| Manual proration logic | Automatic proration in Stripe | Always available | Eliminates complex billing calculations |
| Smart Retries opt-in | Smart Retries default enabled | 2023 | Improved payment recovery rates without code changes |

**Deprecated/outdated:**
- **Plans resource:** Replaced by Prices in 2020. Use `stripe.prices.create()` not `stripe.plans.create()`
- **Sources API:** Replaced by Payment Methods. Use `payment_method_types` not `source`
- **Tokens API:** Use Setup Intents for saving payment methods

## Open Questions

Things that couldn't be fully resolved:

1. **Membership Tier Mapping Between Systems**
   - What we know: Payload has `membershipTier: 'community' | 'community_ai'`, Drizzle planner_subscription has `tier: 'free' | 'pro' | 'business'`
   - What's unclear: Exact mapping logic. Is Community = free and Community + AI = pro? Or is Community = pro (base membership)?
   - Recommendation: Define explicit mapping in STATE.md or constants file. Suggest: `community → pro`, `community_ai → business`, `none → free`

2. **Onboarding Flow Completion Requirement**
   - What we know: Onboarding wizard should collect workspace name, industry, company size
   - What's unclear: Should onboarding be mandatory (block tool access) or optional (skip button)?
   - Recommendation: Make mandatory with skip option. Track completion for email follow-ups. Implement middleware check.

3. **Multi-Workspace Support for Memberships**
   - What we know: Phase 1 decided per-user subscriptions (not per-workspace) for v1 simplicity
   - What's unclear: If user is owner of 2 workspaces, do both get access under single subscription?
   - Recommendation: Yes, subscription is personal. All workspaces owned by member get access to premium tools. Document this in membership pricing page.

4. **Trial Period Support**
   - What we know: Not mentioned in requirements, but Stripe supports trial periods on subscriptions
   - What's unclear: Should Phase 2 include trial support (e.g., 7-day free trial)?
   - Recommendation: Defer to v2 unless business requirements specify. Trials add complexity (trial_end webhook events, conversion tracking). Focus on paid conversion first.

5. **Upgrade/Downgrade Flow Complexity**
   - What we know: Customer Portal handles upgrades/downgrades with automatic proration
   - What's unclear: Should in-app UI duplicate this functionality or only use Customer Portal?
   - Recommendation: Phase 2 uses Customer Portal exclusively. In-app UI can show "Manage subscription" button linking to portal. Avoids duplicating Stripe's proration logic.

## Sources

### Primary (HIGH confidence)
- [Stripe Subscriptions Overview](https://docs.stripe.com/billing/subscriptions/overview) - Subscription billing fundamentals
- [Stripe Checkout Sessions API](https://docs.stripe.com/api/checkout/sessions/create) - Checkout mode and line_items configuration
- [Stripe Prices API](https://docs.stripe.com/api/prices/create) - Creating prices with recurring intervals
- [Stripe Subscription Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) - Lifecycle event handling
- [Stripe Customer Portal](https://docs.stripe.com/customer-management) - Self-service subscription management
- [React Email Documentation](https://react.email) - Email template best practices

### Secondary (MEDIUM confidence)
- [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests) - Webhook idempotency patterns
- [React Email Templates](https://react.email/templates) - Pre-built template examples
- [Next.js Forms Guide](https://nextjs.org/docs/app/guides/forms) - Server action patterns
- [Next.js Server Actions](https://makerkit.dev/blog/tutorials/nextjs-server-actions) - Form validation patterns
- [Onborda GitHub](https://github.com/uixmat/onborda) - Onboarding library patterns (for reference, not recommended)

### Tertiary (LOW confidence)
- Community discussions on mixed cart handling (Stripe supports but UX complexity noted)
- Blog posts on subscription management best practices (general patterns, not Stripe-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Stripe API well-documented, Payload integration verified in codebase, Resend already integrated
- Architecture: HIGH - Patterns verified with official Stripe docs, existing webhook handler provides foundation
- Pitfalls: MEDIUM - Based on common subscription billing issues, cart separation issue documented in STATE.md

**Research date:** 2026-02-15
**Valid until:** 2026-03-15 (30 days for stable Stripe API, recommend re-verification before implementation)
