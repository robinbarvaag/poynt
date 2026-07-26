# Plan 003: Enforce active membership at the API layer for community chat and file uploads

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4d57496..HEAD -- packages/planner-api/trpc.ts packages/planner-api/routers/chat.ts apps/web/app/api/on-poynt`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/001-ci-and-test-baseline.md (nominal — for the verification gate)
- **Category**: security (access control)
- **Planned at**: commit `4d57496`, 2026-07-26

## Why this matters

The member portal's paywall is enforced only in the page layout (`apps/web/app/(on-poynt)/on-poynt/(app)/layout.tsx:31-33` redirects when `hasActiveAccess` fails). The APIs underneath do not check membership — only that a session exists. Signup is open (Google OAuth / magic link), so **any registered account with no paid membership** can call the tRPC chat API directly to: enumerate the full member directory (including confirming whether a given email belongs to a member, via substring search on `planner_user.email`), read and post in all community channels, open DMs to any member, and upload files to Vercel Blob via the upload routes. This defeats the paywall for the fellesskap (which exists to replace a members-only Facebook group) and exposes member PII to non-paying accounts. After this plan, every chat procedure and both upload routes require an active membership using the exact same access rules as the page layout.

## Current state

- `packages/planner-api/trpc.ts` — tRPC procedure definitions.
  - `protectedProcedure` (lines 30-44) checks only `ctx.userId` (session).
  - `aiProtectedProcedure` (lines 50-~95) is the template to copy from: it queries `plannerSubscription` by `ctx.userId` and enforces status rules:

```ts
// trpc.ts:58-84 (excerpt)
const [sub] = await db
  .select()
  .from(plannerSubscription)
  .where(eq(plannerSubscription.userId, ctx.userId))
  .limit(1);

if (!sub || sub.tier !== "community_ai") {
  throw new TRPCError({ code: "FORBIDDEN", message: "community_ai" });
}

const allowedStatuses = ["active", "canceled", "past_due"] as const;
// ... for "canceled": only allow if sub.currentPeriodEnd > new Date()
```

- The canonical access rules live in `apps/web/lib/membership/has-active-access.ts` (`hasActiveAccess`): tier `"none"` → no access; `"active"` → access; `"canceled"` with `currentPeriodEnd` in the future → access; `"past_due"` → access (grace period); everything else → no. **`packages/planner-api` cannot import from `apps/web`** — the new procedure must re-implement these rules inside `trpc.ts` (the same duplication `aiProtectedProcedure` already accepts).
- `packages/planner-api/routers/chat.ts` — the community/chat router; **26 uses of `protectedProcedure`** (channels, messages, DMs, groups, uploads-metadata, `listMembers` at line 886 which selects from `plannerUser` with `ilike` search on name/email, `unreadCount` at 918, etc.). All of it is member-only surface by design.
- `apps/web/app/api/on-poynt/community-upload/route.ts` — community attachment upload to Vercel Blob; auth is session-only:

```ts
// community-upload/route.ts:29-33
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
```

- `apps/web/app/api/on-poynt/upload/route.ts` — brand-asset upload, same session-only pattern (check around lines 32-36).
- The correctly-gated exemplar for route handlers: `apps/web/app/(on-poynt)/on-poynt/api/podcast/transcribe-url/route.ts:22-31` — it resolves membership and rejects before doing work. Also `getSessionWithMembership(request)` in `apps/web/lib/membership.ts:37` returns `{ user, session, membership }` where `membership` feeds `hasActiveAccess` directly (see the layout excerpt below).

```ts
// apps/web/app/(on-poynt)/on-poynt/(app)/layout.tsx:22-33 — the rule to mirror
const session = await getSessionWithMembership(request);
if (!session) redirect("/on-poynt/innlogging");
if (!hasActiveAccess(session.membership)) redirect("/on-poynt/ingen-tilgang");
```

- Grace-period nuance that MUST be preserved: `canceled`-within-period and `past_due` users are paying members in grace — they keep chat access. Do not gate on `status === "active"` alone.
- Conventions: Norwegian comments/messages (bokmål for user-facing strings, e.g. `"Du må være logget inn for å gjøre dette"`); Biome (`noForEach`, no `any`).

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Typecheck | `bun run typecheck`  | exit 0              |
| Tests     | `bun run test`       | all pass            |
| Lint      | `bun run check:ci`   | exit 0              |

## Scope

**In scope** (the only files you should modify or create):
- `packages/planner-api/trpc.ts` (add `memberProcedure` + extracted status helper)
- `packages/planner-api/routers/chat.ts` (swap `protectedProcedure` → `memberProcedure`)
- `apps/web/app/api/on-poynt/community-upload/route.ts` (membership gate)
- `apps/web/app/api/on-poynt/upload/route.ts` (membership gate)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `aiProtectedProcedure`'s tier condition (`sub.tier !== "community_ai"`) — plan 005 fixes the agency-tier gap there; changing it here creates a merge collision. You MAY extract the shared status-check helper it uses, but keep its tier condition byte-identical.
- Other routers in `packages/planner-api/routers/` — some procedures there may be intentionally available to logged-in-but-not-yet-member users (e.g. onboarding, application flows). Only `chat.ts` is in scope.
- The page-layer gating in `layout.tsx` — already correct.
- `packages/planner-api/lib/admin-access.ts` — admin gating is separate (backlog item).

## Git workflow

- Branch: `advisor/003-member-gate-chat-uploads`
- Suggested commit: `fix: krev aktivt medlemskap i chat-API og opplastingsruter`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add `memberProcedure` to `packages/planner-api/trpc.ts`

Below `protectedProcedure`, add a procedure that:

1. Rejects with `UNAUTHORIZED` / `"Du må være logget inn for å gjøre dette"` when `!ctx.userId` (same as `protectedProcedure`).
2. Loads the subscription exactly like `aiProtectedProcedure` (lines 58-62).
3. Applies the `hasActiveAccess` rules (re-implemented locally — document with a comment that the canonical rules live in `apps/web/lib/membership/has-active-access.ts` and must be kept in sync):
   - no subscription row, or `tier === "none"` → FORBIDDEN
   - `status === "active"` → allow
   - `status === "canceled"` and `currentPeriodEnd > new Date()` → allow
   - `status === "past_due"` → allow (grace)
   - otherwise → FORBIDDEN with message `"Krever aktivt medlemskap"`.
4. Passes `ctx` through with the non-null `userId` like the existing procedures do.

Optionally extract the shared "allowed status" logic used by both `memberProcedure` and `aiProtectedProcedure` into a private function in the same file — but `aiProtectedProcedure`'s external behavior must not change.

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Swap the chat router onto `memberProcedure`

In `packages/planner-api/routers/chat.ts`, replace every `protectedProcedure` with `memberProcedure` (update the import from `../trpc`). Expected count: 26 replacements.

**Verify**: `grep -c "protectedProcedure" packages/planner-api/routers/chat.ts` → `0`; `grep -c "memberProcedure" packages/planner-api/routers/chat.ts` → ≥26; `bun run typecheck` → exit 0.

### Step 3: Gate both upload routes on active membership

In `community-upload/route.ts` and `upload/route.ts`, replace the session-only check with the layout's pattern:

```ts
const session = await getSessionWithMembership(req);
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
if (!hasActiveAccess(session.membership)) {
  return NextResponse.json({ error: "Krever aktivt medlemskap" }, { status: 403 });
}
```

Imports: `getSessionWithMembership` from `@/lib/membership`, `hasActiveAccess` from `@/lib/membership/has-active-access` (confirm the exact import specifiers other files in `apps/web` use — e.g. how `layout.tsx` imports them — and match). `getSessionWithMembership` takes a `Request`; `NextRequest` is one, pass `req` directly. Remove the now-unused `auth` import if nothing else in the file uses it.

**Verify**: `bun run typecheck` → exit 0; `grep -n "hasActiveAccess" apps/web/app/api/on-poynt/community-upload/route.ts apps/web/app/api/on-poynt/upload/route.ts` → one hit in each.

### Step 4: Full verification

**Verify**: `bun run test`, `bun run typecheck`, `bun run check:ci` all exit 0 from root.

Manual smoke for the operator (document, do not block): log in with a Better Auth account that has no `planner_subscription` row, then POST to `/on-poynt/api/trpc/chat.listMembers` and to `/api/on-poynt/community-upload` — both must now return 403/FORBIDDEN instead of data.

## Test plan

- The access rules themselves are covered by `has-active-access.test.ts` from plan 001 (the tRPC copy mirrors them).
- If plan 001 landed, add table-driven tests for the new local status logic **only if** you extracted it as an exported pure helper; otherwise skip (testing tRPC middleware end-to-end needs a DB harness that does not exist yet — deferred, see Maintenance notes).
- Verification: `bun run test` → all pass.

## Done criteria

- [ ] `grep -c "protectedProcedure" packages/planner-api/routers/chat.ts` → 0
- [ ] `memberProcedure` exists in `packages/planner-api/trpc.ts` and implements the four access rules above
- [ ] Both upload routes return 403 for session-without-membership (code path present: `hasActiveAccess` referenced in each)
- [ ] `aiProtectedProcedure`'s tier condition is unchanged (`grep -n 'tier !== "community_ai"' packages/planner-api/trpc.ts` → still present)
- [ ] `bun run typecheck`, `bun run test`, `bun run check:ci` exit 0
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any procedure in `chat.ts` is referenced from a non-member surface (search callers: if a public/onboarding page invokes a chat procedure, gating it would break signup flows — report which).
- The excerpts above don't match the live code (drift).
- `getSessionWithMembership` cannot be used in the upload routes without a circular import or edge-runtime conflict.
- You are tempted to touch `aiProtectedProcedure`'s tier check — that is plan 005's scope.

## Maintenance notes

- The access rules now exist in two places by necessity (`apps/web/lib/membership/has-active-access.ts` and the copy in `packages/planner-api/trpc.ts`). If the grace-period policy changes (e.g. `past_due` loses access), BOTH must change. A future refactor could move `hasActiveAccess` into `@poynt/planner-validators` (which both sides already import) to end the duplication — good follow-up, deliberately not done here to keep this change small.
- Any new router serving member-only data must use `memberProcedure`, not `protectedProcedure` — reviewers should check this on every planner-api PR.
- Deferred: rate limiting on the upload routes and a per-user storage quota (cost control) — see backlog.
