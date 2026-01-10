# Task 6: Stripe Integration

> **Read PLAN.md first** for full context.

## Prerequisites

- Cart working.
- Stripe account keys available (test mode).

## Goal

Connect the frontend cart to Stripe Checkout and handle the fulfillment via Webhooks.

## Files to Modify

| File                                          | Action | Description                         |
| --------------------------------------------- | ------ | ----------------------------------- |
| `apps/web/app/api/checkout/route.ts`          | Create | Create Stripe Session               |
| `apps/web/app/api/webhooks/stripe/route.ts`   | Create | Handle `checkout.session.completed` |
| `packages/stripe/src/actions.ts`              | Modify | Helper to create session            |
| `apps/web/app/(frontend)/kvittering/page.tsx` | Create | Success page                        |

## Steps

### 1. Checkout API

**File**: `apps/web/app/api/checkout/route.ts`
**Action**: Create

- Receive cart items.
- Validate prices against Payload DB (never trust client prices).
- Call `stripe.checkout.sessions.create`.
- Return `url` to redirect.
- **Metadata**: Add `userId` (if logged in) or `email` content to metadata for webhook tracking.

### 2. Webhook Handler

**File**: `apps/web/app/api/webhooks/stripe/route.ts`
**Action**: Create

- Verify Stripe signature.
- Switch on `checkout.session.completed`.
- **Logic**:
  1. Check if user exists by email, else create.
  2. Create `Order` in Payload linked to User.
  3. Send email (via `@poynt/email`).

### 3. Success Page

**File**: `apps/web/app/(frontend)/kvittering/page.tsx`
**Action**: Create
Simple "Takk for kjøpet". Clean cart logic (`clearCart()`).

## Verification

### Manual

- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Perform purchase.
- Check Payload Admin -> Order created? User linked?
