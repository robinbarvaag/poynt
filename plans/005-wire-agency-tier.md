# Plan 005: Wire the "agency" membership tier through subscription sync and AI gating

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4d57496..HEAD -- apps/web/lib/membership/sync-subscription.ts packages/planner-api/trpc.ts packages/planner-validators/workspace.ts apps/web/lib/membership/has-active-access.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/003-membership-gate-chat-and-uploads.md (both touch `packages/planner-api/trpc.ts` — do 003 first to avoid conflicts)
- **Category**: bug (entitlements)
- **Planned at**: commit `4d57496`, 2026-07-26

## Why this matters

The `agency` ("Byrå") tier is fully defined in the data layer — the DB enum includes it (migration `0006` added it to `planner_subscription_tier`), `packages/planner-validators/workspace.ts` defines its labels/limits, and `hasAiTools` in `apps/web` deliberately includes it — but two money-path modules never got the memo:

1. **Stripe sync downgrades it.** `getTierFromSubscription` only recognizes `community`/`community_ai` and defaults everything else to `community`. If an agency subscription is ever created (Stripe metadata `tier=agency`), every webhook sync silently overwrites the tier to `community`, stripping the customer's AI entitlement and workspace limits.
2. **tRPC AI gate excludes it.** `aiProtectedProcedure` hardcodes `sub.tier !== "community_ai"`, so even a correctly-stored agency subscriber gets FORBIDDEN on every AI tool — the top-priced tier would have *less* access than the tier below it.

The comment in `has-active-access.ts` explicitly warns against exactly this bug: «bruk denne i stedet for `tier === "community_ai"` (som ville stengt byrå-kunder ute)». No live agency customers exist yet (pre-launch), so this is cheap to fix now and expensive to debug after launch.

## Current state

- `packages/planner-validators/workspace.ts` — the tier's source of truth. Lines 37-38 and 47 include `"agency"` in the tier arrays; line 54 labels it `agency: "Byrå"`; line 77 gives it unlimited workspaces. The exported `MembershipTier` type from this package **already includes** `"agency"`.
- `apps/web/lib/membership.ts:4-6` — re-exports `MembershipTier` from `@poynt/planner-validators` (so app-side types already carry `agency`).
- `apps/web/lib/membership/has-active-access.ts:4-12` — the intended shared gate:

```ts
const AI_TIERS: readonly MembershipTier[] = ["community_ai", "agency"];
export function hasAiTools(tier: MembershipTier): boolean {
  return AI_TIERS.includes(tier);
}
```

- `apps/web/lib/membership/sync-subscription.ts` — the buggy narrow type and mapper:

```ts
// sync-subscription.ts:6
export type MembershipTier = "none" | "community" | "community_ai";

// sync-subscription.ts:13-33 (excerpt)
export function getTierFromSubscription(subscription: Stripe.Subscription): MembershipTier {
  const tierFromSubMeta = subscription.metadata?.tier;
  if (tierFromSubMeta === "community" || tierFromSubMeta === "community_ai") {
    return tierFromSubMeta;
  }
  const tierFromPriceMeta = subscription.items.data[0]?.price.metadata?.tier;
  if (tierFromPriceMeta === "community" || tierFromPriceMeta === "community_ai") {
    return tierFromPriceMeta;
  }
  console.warn(`No tier metadata found on subscription ${subscription.id}, defaulting to 'community'`);
  return "community";
}
```

  Note this file declares its own local `MembershipTier` that shadows the canonical one from `@poynt/planner-validators`.

- `packages/planner-api/trpc.ts:64` — the hardcoded gate inside `aiProtectedProcedure`:

```ts
if (!sub || sub.tier !== "community_ai") {
  throw new TRPCError({ code: "FORBIDDEN", message: "community_ai" });
}
```

  `packages/planner-api` **cannot** import from `apps/web`, but it CAN import from `@poynt/planner-validators` (check its `package.json`; add the workspace dep if missing — pattern: `"@poynt/planner-validators": "workspace:*"`).

- Conventions: Norwegian comments; Biome; the FORBIDDEN `message: "community_ai"` is machine-read by the UI's TierGate — see STOP conditions before changing it.

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Typecheck | `bun run typecheck`  | exit 0              |
| Tests     | `bun run test`       | all pass            |
| Lint      | `bun run check:ci`   | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `packages/planner-validators/workspace.ts` (add shared `AI_TIERS`/`hasAiTools`)
- `apps/web/lib/membership/has-active-access.ts` (re-export from validators instead of local copy)
- `apps/web/lib/membership/sync-subscription.ts` (accept `agency`; use canonical type)
- `packages/planner-api/trpc.ts` (use `hasAiTools` in `aiProtectedProcedure`)
- `packages/planner-api/package.json` (only if the validators dep is missing)
- `apps/web/lib/membership/has-active-access.test.ts` (extend, if plan 001 landed)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- Checkout/purchase flows — nothing sells `agency` yet; this plan only makes the plumbing honest.
- `memberProcedure` from plan 003 — its any-paid-tier logic is unaffected.
- The DB schema/enum — `agency` is already in the enum (`packages/planner-db/schema/workspace.ts:32`); no migration.
- UI surfaces (pricing page, TierGate copy).

## Git workflow

- Branch: `advisor/005-wire-agency-tier`
- Suggested commit: `fix: agency-nivået beholdes i Stripe-sync og slipper gjennom AI-gaten`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Move `hasAiTools` to the shared validators package

In `packages/planner-validators/workspace.ts`, next to the existing tier definitions, add (reusing the file's existing tier-array style):

```ts
/**
 * Nivåene som låser opp AI-verktøyene. «agency» (Byrå) arver alt fra
 * Community AI — all AI-gating skal sjekke begge via hasAiTools, aldri
 * `tier === "community_ai"` direkte.
 */
export const AI_TIERS = ["community_ai", "agency"] as const satisfies readonly MembershipTier[];

export function hasAiTools(tier: MembershipTier): boolean {
  return (AI_TIERS as readonly MembershipTier[]).includes(tier);
}
```

(Adapt the type name to whatever the tier type is actually called in this file — read it first; it may be exported under a different name that `apps/web/lib/membership.ts:4` aliases.)

Then in `apps/web/lib/membership/has-active-access.ts`, delete the local `AI_TIERS`/`hasAiTools` and re-export: `export { hasAiTools } from "@poynt/planner-validators";` — keeping `hasActiveAccess` unchanged. Confirm all existing importers of `hasAiTools` still resolve (`grep -rn "hasAiTools" apps/web packages/`).

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Accept `agency` in the Stripe sync

In `apps/web/lib/membership/sync-subscription.ts`:

1. Replace the local `export type MembershipTier = ...` with `import type { MembershipTier } from "@poynt/planner-validators";` + `export type { MembershipTier };` (preserving the existing export so importers don't break — check with `grep -rn 'from.*sync-subscription' apps/web`).
2. In `getTierFromSubscription`, extend both metadata checks to a shared validator, e.g.:

```ts
const PAID_TIERS = ["community", "community_ai", "agency"] as const;
function isPaidTier(v: string | undefined): v is (typeof PAID_TIERS)[number] {
  return !!v && (PAID_TIERS as readonly string[]).includes(v);
}
```

   and use `isPaidTier(tierFromSubMeta)` / `isPaidTier(tierFromPriceMeta)`. The default-to-`community` fallback and its warning stay as-is.

**Verify**: `bun run typecheck` → exit 0.

### Step 3: Fix the tRPC AI gate

In `packages/planner-api/trpc.ts`, import `hasAiTools` from `@poynt/planner-validators` (add the workspace dep to `packages/planner-api/package.json` if absent, then `bun install`). Change line 64's condition to:

```ts
if (!sub || !hasAiTools(sub.tier)) {
```

Keep the `TRPCError` exactly as it is — `message: "community_ai"` is a sentinel the frontend TierGate matches on (see STOP conditions).

**Verify**: `bun run typecheck` → exit 0; `grep -n 'tier !== "community_ai"' packages/planner-api/trpc.ts` → no matches.

### Step 4: Extend tests and run full verification

If `apps/web/lib/membership/has-active-access.test.ts` exists (plan 001), it already asserts `hasAiTools("agency") === true` — confirm it still passes against the re-exported implementation. Add a test file for the sync mapper **only if** importing `sync-subscription.ts` no longer pulls in `@poynt/planner-db` at module load (it currently does — if so, skip, matching plan 001's deferral).

**Verify**: `bun run test`, `bun run typecheck`, `bun run check:ci` all exit 0 from root.

## Test plan

- Existing: `has-active-access.test.ts` (plan 001) covers `hasAiTools` for all four tiers — must stay green after the re-export.
- Deferred (documented): unit tests for `getTierFromSubscription` with `metadata.tier = "agency"` — blocked on the module's DB import (same deferral as plan 001; unblock by extracting the pure functions to a DB-free module in a future cleanup).

## Done criteria

- [ ] `grep -rn '"community_ai", "agency"' packages/planner-validators/` → the shared `AI_TIERS` exists there
- [ ] `grep -n 'tier !== "community_ai"' packages/planner-api/trpc.ts` → no matches; `hasAiTools` used instead
- [ ] `grep -n '"none" | "community" | "community_ai"' apps/web/lib/membership/sync-subscription.ts` → no matches (canonical type imported)
- [ ] `getTierFromSubscription` accepts `agency` from both subscription and price metadata
- [ ] `bun run typecheck`, `bun run test`, `bun run check:ci` exit 0
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The frontend matches the FORBIDDEN sentinel differently than expected: `grep -rn '"community_ai"' apps/web/components apps/web/app/(on-poynt)` — if TierGate string-matches the error message AND displays it verbatim to agency users, the message may need to become a neutral sentinel; report what you find rather than renaming it unilaterally.
- `packages/planner-validators`' tier type does not actually include `"agency"` (drift from the excerpt).
- Adding the validators dep to `planner-api` creates a circular workspace dependency (`planner-validators` importing from `planner-api` — it shouldn't, but check its imports).
- Plan 003 has not landed and `trpc.ts` differs materially from the excerpts.

## Maintenance notes

- Any future tier (e.g. a trial tier) must be added in exactly three places: the DB enum (migration), `planner-validators` tier arrays, and `getTierFromSubscription`'s `PAID_TIERS`. The type system now enforces the middle one.
- When agency is actually sold, checkout must set `metadata.tier = "agency"` on the Stripe subscription or price — this plan makes the webhook honor it but does not create the sales path.
- Reviewers: reject any new `tier === "community_ai"` comparison anywhere; `hasAiTools` is the only sanctioned AI-gate predicate.
