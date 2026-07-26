# Plan 002: Make webhook processing retry-safe — never mark failed events as processed, claim events atomically

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4d57496..HEAD -- apps/web/app/api/webhooks apps/web/lib/webhook-events.ts packages/planner-db/schema/webhook.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-ci-and-test-baseline.md (test runner + CI)
- **Category**: bug (money path)
- **Planned at**: commit `4d57496`, 2026-07-26

## Why this matters

Two defects in the Stripe webhook make paid-but-undelivered orders possible:

1. **Failed events are recorded as processed.** When any handler throws (DB blip, Stripe/Resend timeout, `payload.create` failure), the catch block still inserts the event into the idempotency table. Every Stripe retry then short-circuits at the "already processed" check. A customer can pay and end up with no order created or no membership synced, with no self-healing — the money is taken, nothing is delivered, and the event can never be retried.
2. **Idempotency is check-then-act.** Both the Stripe and Vipps webhooks SELECT for the event id, process (create order, capture payment, send email), and only INSERT the marker afterwards. Two concurrent deliveries of the same event both pass the empty SELECT and both run the side effects (double order + double confirmation email; double Vipps capture attempt).

After this plan: a failed event is retried by the provider until it succeeds (Stripe retries for ~3 days), and concurrent duplicates are excluded by an atomic insert-first claim on the unique `event_id` column.

## Current state

- `apps/web/app/api/webhooks/stripe/route.ts` — Stripe webhook. Handles `checkout.session.completed` (routes to `handleMembershipPurchase` or `handleProductPurchase`), `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`. The problem section (lines 507–589):

```ts
// stripe/route.ts:507-517 — check-then-act idempotency
const existingEvent = await db
  .select()
  .from(plannerWebhookEvent)
  .where(eq(plannerWebhookEvent.eventId, event.id))
  .limit(1);
if (existingEvent.length > 0) {
  console.log(`Webhook event ${event.id} already processed, skipping`);
  return NextResponse.json({ received: true });
}
```

```ts
// stripe/route.ts:568-586 — success-insert, and the BUG: insert-on-error too
    // Record successful processing
    await db.insert(plannerWebhookEvent).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
    });
  } catch (error) {
    console.error("Feil ved behandling av webhook:", error);
    // Still record the event as processed to prevent retries
    await db.insert(plannerWebhookEvent).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
    });
    return NextResponse.json(
      { error: "Feil ved behandling av webhook" },
      { status: 500 }
    );
  }
```

- `apps/web/app/api/webhooks/vipps/route.ts` — Vipps webhook. Same check-then-act pattern (SELECT at lines 84–92 with `eventId = \`vipps:${reference}:${name}:${event.pspReference ?? ""}\``, success-INSERT at 209–213), but its catch block is already correct — it does **not** record on error (lines 214–221, comment: "Ikkje registrer eventen — då prøver Vipps igjen"). The Vipps `AUTHORIZED` branch additionally guards on `order.status !== "pending"` (line 111), which is an extra order-level defense that must be preserved.
- `packages/planner-db/schema/webhook.ts` — the idempotency table. `eventId` is `.notNull().unique()` (line 12), which is what makes an insert-first claim atomic. Do not modify this file.
- Convention: code comments in this repo are Norwegian. Biome rules apply (`bun run check`).

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Typecheck | `bun run typecheck`  | exit 0              |
| Tests     | `bun run test` (root) | all pass           |
| Lint      | `bun run check:ci`   | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `apps/web/lib/webhook-events.ts` (create — claim/release helper)
- `apps/web/lib/webhook-events.test.ts` (create)
- `apps/web/app/api/webhooks/stripe/route.ts` (idempotency section + catch block only)
- `apps/web/app/api/webhooks/vipps/route.ts` (idempotency section only)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- The individual event handlers (`handleProductPurchase`, `handleMembershipPurchase`, `handleSubscription*`, `handleInvoice*`, the Vipps `AUTHORIZED`/`ABORTED` branches) — their internals are unchanged by this plan.
- `packages/planner-db/schema/webhook.ts` — the unique constraint already supports the claim pattern; no migration needed.
- Signature verification in both routes — already correct.
- The `agency`-tier and `past_due`-email gaps — separate plans (005 and backlog).

## Git workflow

- Branch: `advisor/002-webhook-reliability`
- Commit style: short lowercase imperative (repo examples: `bugfixes`, `fix(ui): ...`). Suggested: `fix: retry-safe webhook-idempotens (stripe + vipps)`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the claim helper `apps/web/lib/webhook-events.ts`

Two functions, both taking the drizzle `db` as their first argument so tests can pass a fake:

```ts
import type { db as plannerDb } from "@poynt/planner-db";
import { plannerWebhookEvent } from "@poynt/planner-db/schema";
import { eq } from "drizzle-orm";

type Db = typeof plannerDb;

/**
 * Prøver å kravsette (claime) et webhook-event atomisk. Returnerer true hvis
 * dette kallet vant kravet (raden ble satt inn), false hvis eventet allerede
 * er kravsatt/behandlet. Unik-constrainten på event_id gjør dette trygt ved
 * samtidige leveranser.
 */
export async function claimWebhookEvent(
  db: Db,
  eventId: string,
  type: string
): Promise<boolean> {
  const inserted = await db
    .insert(plannerWebhookEvent)
    .values({ id: crypto.randomUUID(), eventId, type })
    .onConflictDoNothing({ target: plannerWebhookEvent.eventId })
    .returning({ eventId: plannerWebhookEvent.eventId });
  return inserted.length > 0;
}

/**
 * Frigir et krav etter feilet behandling, slik at leverandørens retry kan
 * kravsette eventet på nytt.
 */
export async function releaseWebhookEvent(db: Db, eventId: string): Promise<void> {
  await db
    .delete(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, eventId));
}
```

Adjust imports to match how the routes import today (`import { db, eq } from "@poynt/planner-db"` style is used in `apps/web/lib/membership.ts` — mirror whichever compiles).

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Rewrite the Stripe route's idempotency flow

In `apps/web/app/api/webhooks/stripe/route.ts`, replace the section from the `existingEvent` SELECT (line 507) through the end of the catch block (line 586) with:

1. `const claimed = await claimWebhookEvent(db, event.id, event.type);`
   If `!claimed` → log and `return NextResponse.json({ received: true })` (someone else processed or is processing it).
2. `try { switch (event.type) { ... } }` — the switch statement is unchanged.
3. On success: nothing more to insert (the claim row IS the processed marker). Return `{ received: true }`.
4. `catch (error)`: log, then `await releaseWebhookEvent(db, event.id)` inside its own try/catch (if the release itself fails, log and continue — the event stays claimed and needs manual attention, which is safer than double-processing), then return the 500 response so Stripe retries. **Delete the insert-on-error block entirely.**

Remove the now-unused `plannerWebhookEvent` select imports from the route if nothing else uses them.

**Verify**: `bun run typecheck` → exit 0. `grep -n "Still record the event" apps/web/app/api/webhooks/stripe/route.ts` → no matches.

### Step 3: Apply the same claim pattern to the Vipps route

In `apps/web/app/api/webhooks/vipps/route.ts`: replace the SELECT check (lines 84–92) with `claimWebhookEvent(db, eventId, \`vipps.${name.toLowerCase()}\`)` → early-return `{ received: true }` when not claimed. Remove the success-INSERT (lines 209–213). In the existing catch block (which already returns 500 without recording), add `releaseWebhookEvent(db, eventId)` (with the same swallow-release-failure guard) before returning.

Preserve untouched: the `order.status !== "pending"` guard in `AUTHORIZED`, the "no order found" early return, and the Norwegian comments' intent (update the idempotency comment text to describe the claim pattern).

**Verify**: `bun run typecheck` → exit 0.

### Step 4: Unit-test the helper

Create `apps/web/lib/webhook-events.test.ts` using `bun:test`. Because the helper takes `db` as an argument, test it with a minimal fake implementing the chained calls:

- `claimWebhookEvent` returns `true` when the fake's `returning()` resolves to `[{ eventId: "evt_1" }]`, and `false` when it resolves to `[]` (conflict).
- `releaseWebhookEvent` calls `delete().where()` with the expected eventId (assert via a captured argument or call flag).
- The fake needs only: `insert() → { values() → { onConflictDoNothing() → { returning() → Promise } } }` and `delete() → { where() → Promise }`.

**Verify**: `bun test lib` from `apps/web` → new tests pass.

### Step 5: Full verification + manual smoke note

**Verify**: from root — `bun run test`, `bun run typecheck`, `bun run check:ci` all exit 0.

Manual smoke (optional, requires Stripe CLI, documented for the operator — do not block on it): `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, then `stripe trigger checkout.session.completed`; deliver the same event twice and confirm exactly one order row; kill the DB mid-handler and confirm Stripe shows the event as failed/retrying and no `planner_webhook_event` row exists for it.

## Test plan

- New: `apps/web/lib/webhook-events.test.ts` — claim-wins, claim-loses-on-conflict, release-deletes (Step 4).
- Pattern: model file layout after `apps/web/lib/membership/has-active-access.test.ts` created by plan 001.
- Verification: `bun run test` → all pass including the 3+ new tests.

## Done criteria

- [ ] `grep -n "Still record the event" apps/web/app/api/webhooks/stripe/route.ts` → no matches
- [ ] `grep -c "claimWebhookEvent" apps/web/app/api/webhooks/stripe/route.ts apps/web/app/api/webhooks/vipps/route.ts` → ≥1 in each
- [ ] Neither route contains a `db.insert(plannerWebhookEvent)` call anymore (`grep -rn "insert(plannerWebhookEvent" apps/web/app/api/webhooks/` → no matches)
- [ ] `bun run test` exits 0 with the new helper tests passing
- [ ] `bun run typecheck` and `bun run check:ci` exit 0
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at lines 507–586 of the Stripe route or 84–92/209–221 of the Vipps route does not match the excerpts above.
- `onConflictDoNothing({ target: ... }).returning(...)` is rejected by the installed drizzle-orm version (then the claim needs a different atomic construct — report, don't invent one).
- You find any *other* caller inserting into `plannerWebhookEvent` (`grep -rn "plannerWebhookEvent" apps/ packages/` shows sites outside the two routes and the schema) — the claim semantics would need to cover them too.

## Maintenance notes

- The claim row is now written **before** processing. If a handler crashes AND the release also fails, the event stays claimed and will not self-retry — this is deliberate (safer than double-charging side effects). Consider adding a `status` column (`processing`/`done`/`failed`) later if this becomes operationally noisy.
- If webhook handlers ever become non-idempotent at the order level (e.g. Vipps loses its `order.status !== "pending"` guard), the claim is the only defense — reviewers should protect both layers.
- Deferred, related: the `past_due` payment-failed email (see backlog in plans/README.md) will add a send inside `handleInvoicePaymentFailed`; it must tolerate the retry semantics introduced here (an email helper should be idempotent per invoice id).
