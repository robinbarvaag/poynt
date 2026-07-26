# Plan 001: Establish a real CI pipeline and a bun-test verification baseline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4d57496..HEAD -- .github/workflows package.json turbo.json packages/cart apps/web/lib/membership`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests + dx
- **Planned at**: commit `4d57496`, 2026-07-26

## Why this matters

This repo has **zero automated tests** and **no CI**: `.github/workflows/` is empty (three stale workflows from an unrelated project were removed by the operator on 2026-07-26), so nothing runs on push or PR. `bun run typecheck`, `bun run check:ci`, and any future tests execute only when a developer remembers to run them. Every other plan in `plans/` relies on the verification baseline this plan creates. After this lands there is a one-command way (`bun run test`) to know the pure business logic works, and every PR is gated by lint + typecheck + tests.

## Current state

- `.github/workflows/` — empty (or absent); this plan creates `ci.yml` there.
- `package.json` (repo root) — scripts include `"lint"`, `"typecheck": "turbo typecheck"`, `"check:ci": "biome ci ."` but **no `test` script**. `"packageManager": "bun@1.2.0"`.
- `turbo.json` — tasks: `build`, `typecheck`, `dev`, `clean`. No `test` task. Full current content:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": [
    "DATABASE_URI", "PAYLOAD_SECRET", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL",
    "OPENAI_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
    "RESEND_API_KEY", "BLOB_READ_WRITE_TOKEN", "PODCAST_RSS_URL"
  ],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "typecheck": { "dependsOn": ["^typecheck"] },
    "dev": { "cache": false, "persistent": true },
    "clean": { "cache": false }
  }
}
```

- `packages/cart/index.ts` — the whole cart package: a Zustand store (`useCart`) with pure helper logic. Key behaviors to test (excerpt):

```ts
// packages/cart/index.ts:34-41
function lineKey(id: string, variantValue?: string): string {
  return variantValue ? `${id}::${variantValue}` : id;
}
function clampQuantity(quantity: number, max?: number): number {
  const floored = Math.max(1, Math.floor(quantity));
  return max != null ? Math.min(floored, max) : floored;
}
```

  `addItem` merges lines with the same `key` and clamps against `maxQuantity` (lines 61-99); `updateQuantity` clamps (100-108); `total()`/`count()` reduce over items (115-117). The store uses `persist(..., { name: "poynt-cart", version: 2 })` — in a test environment with no `localStorage` Zustand logs a warning and runs in-memory; that is fine, assert via `useCart.getState()`.

- `apps/web/lib/membership/has-active-access.ts` — pure functions `hasAiTools(tier)` and `hasActiveAccess(membership)`. Its only import is **type-only** (`import type { MembershipInfo, MembershipTier } from "../membership"`), so importing it in a test pulls in no runtime dependencies (no DB, no auth).

- Repo conventions: Biome is the only linter (`biome.json` at root) — rules include `noForEach` (use `for...of`) and no `any`. Code comments are written in Norwegian. Bun is the runtime; `bun test` is Bun's built-in test runner (no dependency to install), it auto-discovers `*.test.ts`.

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Install   | `bun install`        | exit 0              |
| Typecheck | `bun run typecheck`  | exit 0              |
| Lint/format check | `bun run check:ci` | exit 0        |
| Tests (after this plan) | `bun run test` | all pass, exit 0 |
| Single package tests | `bun test` (run inside the package dir) | all pass |

## Scope

**In scope** (the only files you should modify or create):
- `.github/workflows/ci.yml` (create)
- `package.json` (root — add `test` script)
- `turbo.json` (add `test` task)
- `packages/cart/package.json` (add `test` script)
- `packages/cart/index.test.ts` (create)
- `apps/web/package.json` (add `test` script)
- `apps/web/lib/membership/has-active-access.test.ts` (create)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- Any source file under `apps/web` or `packages/*` other than the two new test files and the two `package.json` scripts. This plan adds tests; it never changes runtime behavior.
- `apps/web/lib/membership/sync-subscription.ts` — its pure functions are tempting to test, but the file imports `@poynt/planner-db` at module level, which reads `DATABASE_URI` at import time. Testing it is deferred (see Maintenance notes).
- Running `next build` in CI — the Payload/Next build needs a database and secrets; deploy builds happen on Vercel. Do not add a build step to CI.

## Git workflow

- Branch: `advisor/001-ci-and-test-baseline`
- Commit style: short lowercase imperative, optionally conventional-commit prefixed (repo examples: `feature flags in on-poynt`, `fix(ui): ...`). Suggested: `ci: replace foreign workflows with real CI + bun test baseline`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `.github/workflows/ci.yml`

Create the directory if absent.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.2.0" # hold i takt med packageManager i package.json
      - run: bun install --frozen-lockfile
      - run: bun run check:ci
      - run: bun run typecheck
      - run: bun run test
```

If `bun install --frozen-lockfile` fails in CI because the lockfile is out of date, that is a real finding — STOP and report rather than dropping the flag.

**Verify**: `bunx yaml-lint .github/workflows/ci.yml` if available, otherwise a plain read-through; file exists with the four run steps.

### Step 2: Wire the `test` task through turbo

1. In `turbo.json`, add to `tasks`:
   ```json
   "test": { "dependsOn": ["^build"], "cache": true }
   ```
   Note: the workspace packages have no `build` outputs to depend on today; `"dependsOn": []` is also acceptable — prefer the simpler `"test": {}` if turbo accepts it.
2. In root `package.json` scripts, add: `"test": "turbo test"`.
3. In `packages/cart/package.json` scripts, add: `"test": "bun test"`.
4. In `apps/web/package.json` scripts, add: `"test": "bun test lib"` (scopes discovery to `apps/web/lib` so bun does not try to load Next/Payload route files).

**Verify**: `bun run test` → turbo runs; packages without a `test` script are skipped; exit 0 (no tests found yet is acceptable at this step — bun exits 0 with "no tests found" only when given an explicit path; if it exits 1, temporarily proceed to Step 3 and re-verify).

### Step 3: Write `packages/cart/index.test.ts`

Use `bun:test` (`import { describe, expect, test, beforeEach } from "bun:test"`). Reset state between tests with `useCart.setState({ items: [] })`. Cases to cover:

1. `addItem` adds a line with quantity 1 by default.
2. `addItem` twice with the same product id merges into one line with quantity 2.
3. `addItem` with `maxQuantity: 1` twice keeps quantity clamped at 1 (the digital-product constraint).
4. Same product id with different `variantValue` produces two separate lines (key = `id::variant`).
5. `updateQuantity` clamps to `maxQuantity` and floors to ≥1 (e.g. setting 0 → 1).
6. `removeItem` removes only the targeted line key.
7. `total()` = Σ price×quantity; `count()` = Σ quantity.
8. `clearCart()` empties items.

A `localStorage`-missing warning from zustand/persist in test output is expected and harmless.

**Verify**: `bun test` run from `packages/cart` → 8+ tests pass.

### Step 4: Write `apps/web/lib/membership/has-active-access.test.ts`

Test the two pure functions. Cases:

- `hasAiTools`: true for `"community_ai"` and `"agency"`, false for `"community"` and `"none"`.
- `hasActiveAccess`: false for tier `"none"` regardless of status; true for status `"active"`; true for `"canceled"` with `currentPeriodEnd` in the future, false with it in the past or null; true for `"past_due"`; false for `"inactive"`.

Build the `MembershipInfo` argument inline (all fields required: `tier`, `status`, `stripeCustomerId: null`, `stripeSubscriptionId: null`, `currentPeriodEnd`, `cancelAtPeriodEnd: false`).

**Verify**: `bun test lib` run from `apps/web` → all tests pass.

### Step 5: Full-repo verification

**Verify**: from repo root — `bun run test` → all tests pass across both packages; `bun run typecheck` → exit 0; `bun run check:ci` → exit 0 (if Biome flags the new files, run `bun run check` to autofix and re-verify).

## Test plan

The new tests ARE the deliverable — see Steps 3–4. There is no existing test to model after (these are the repo's first); follow the structure shown in the steps.

## Done criteria

- [ ] `.github/workflows/ci.yml` exists with install + check:ci + typecheck + test steps
- [ ] `bun run test` exits 0 with ≥13 passing tests
- [ ] `bun run typecheck` exits 0
- [ ] `bun run check:ci` exits 0
- [ ] `git status` shows no modified files outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `bun test` cannot import `packages/cart/index.ts` or `has-active-access.ts` without a database/env error — the assumption "these modules have no runtime side-effect imports" is then false.
- `bun install --frozen-lockfile` fails because `bun.lock` is stale.
- Turbo refuses the `test` task configuration after one fix attempt.

## Maintenance notes

- Deferred: unit tests for `getTierFromSubscription`/`mapSubscriptionStatus` in `apps/web/lib/membership/sync-subscription.ts` — blocked on that file's module-level import of `@poynt/planner-db`. Plan 002/005 touch that file; when someone extracts the pure functions into a DB-free module, add the tests.
- Deferred: a CI build step (needs either a disposable Postgres service container + env stubs, or acceptance that Vercel is the build gate).
- Deferred: `bun audit` as a non-blocking CI step (known transitive advisories under Payload/inngest trees — see plans/README.md backlog).
- Reviewers: watch that future packages add a `test` script so turbo picks them up.
