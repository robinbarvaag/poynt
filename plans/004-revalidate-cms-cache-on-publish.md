# Plan 004: Invalidate the "cms" cache tag when content changes in Payload

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 4d57496..HEAD -- apps/web/collections apps/web/globals apps/web/lib/revalidate-cms.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / perf (cache correctness)
- **Planned at**: commit `4d57496`, 2026-07-26

## Why this matters

Every public-site data fetcher caches with `cacheTag("cms")` + `cacheLife("minutes")` (Next.js 16 `use cache`), but **nothing ever calls `revalidateTag("cms")`** — a repo-wide search finds `revalidateTag` only in the feature-flags global, with the `"features"` tag. So when the partner edits or publishes content in Payload admin, the public site keeps serving stale pages until the time-based cache window lapses. To a non-technical editor this reads as "publishing is broken". The intended pattern already exists and works for feature flags; this plan applies it to the content collections and globals.

## Current state

- Fetchers producing the tag (representative — there are ~12 such sites, all following this shape):

```ts
// apps/web/app/(frontend)/page.tsx:9-16
async function getHomepage() {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");
  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "homepage", depth: 2 });
}
```

  Other producers: `apps/web/app/(frontend)/[...slug]/page.tsx`, `blogg/page.tsx`, `blogg/[slug]/page.tsx`, `produkter/page.tsx`, `tjenester/page.tsx`, `kundehistorier/page.tsx`, `podkast/page.tsx`, `kontakt/page.tsx`, `apps/web/components/blocks/product-archive-block.tsx`, `services-archive-block.tsx`, `apps/web/lib/contact.ts`.

- The exemplar consumer (the ONLY `revalidateTag` call in the repo) — copy this pattern including the try/catch and its reason:

```ts
// apps/web/globals/on-poynt-features.ts:32-43
hooks: {
  afterChange: [
    () => {
      // Revalider cachen så endringen slår gjennom umiddelbart.
      try {
        revalidateTag("features", "max");
      } catch {
        // Utenfor Next-kontekst (f.eks. seed-script) — cachen utløper selv.
      }
    },
  ],
},
```

  The try/catch matters: seed scripts under `apps/web/scripts/` run Payload outside a Next request context, where `revalidateTag` throws. Note the second argument `"max"` — keep it, matching the exemplar.

- Collections are registered in `apps/web/payload.config.ts:68-85`: Pages, BlogPosts, CaseStudies, Services, Categories, Media, Newsletters, Guides, Courses, Products, Orders, Users. Globals at lines 86-99: Homepage, BlogPage, PodcastPage, ProductsPage, ServicesPage, Header, Footer, SiteSettings, CheckoutSettings, OnPoyntFeatures.
- Collection config files live in `apps/web/collections/*.ts`, globals in `apps/web/globals/*.ts`. Example of an existing collection `hooks` block you will extend (BlogPosts already has a `beforeChange` slug hook):

```ts
// apps/web/collections/blog-posts.ts:37-46
hooks: {
  beforeChange: [
    async ({ data }) => {
      if (!data.slug && data.title) {
        data.slug = generateSlug(data.title);
      }
      return data;
    },
  ],
},
```

- Conventions: Norwegian (bokmål) comments; Biome rules; Payload types: `CollectionConfig["hooks"]` uses `afterChange`/`afterDelete` arrays, `GlobalConfig["hooks"]` has `afterChange` only (globals cannot be deleted).

## Commands you will need

| Purpose   | Command              | Expected on success |
|-----------|----------------------|---------------------|
| Typecheck | `bun run typecheck`  | exit 0              |
| Lint      | `bun run check:ci`   | exit 0              |
| Tests     | `bun run test`       | all pass (if plan 001 landed) |

## Scope

**In scope** (the only files you should modify or create):
- `apps/web/lib/revalidate-cms.ts` (create — shared hook helpers)
- `apps/web/collections/pages.ts`, `blog-posts.ts`, `case-studies.ts`, `services.ts`, `categories.ts`, `media.ts`, `products.ts`, `guides.ts`, `courses.ts` (register hooks; exact filenames may differ in casing — locate by collection slug)
- `apps/web/globals/` files for Homepage, BlogPage, PodcastPage, ProductsPage, ServicesPage, Header, Footer, SiteSettings, CheckoutSettings (register afterChange hook)
- `plans/README.md` (status row)

**Out of scope** (do NOT touch):
- `apps/web/globals/on-poynt-features.ts` — already has its own `"features"` invalidation; adding `"cms"` there is wrong (member-portal flags are not public-site content).
- `collections/orders.ts` and `collections/users.ts` — not public content; invalidating on every order write would churn the cache pointlessly.
- `collections/newsletters.ts` — admin-side sending tool, not rendered on the public site. (If a grep shows a frontend fetcher reading `newsletters` with `cacheTag("cms")`, include it and note that in your report.)
- The fetchers themselves — no changes to `use cache` / `cacheTag` call sites.

## Git workflow

- Branch: `advisor/004-revalidate-cms`
- Suggested commit: `fix: revalider «cms»-cachen når innhold endres i Payload`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create `apps/web/lib/revalidate-cms.ts`

```ts
import { revalidateTag } from "next/cache";

/**
 * Felles hooks som tømmer «cms»-cachen (alle offentlige sider tagges med
 * cacheTag("cms")) så innholdsendringer i admin slår gjennom umiddelbart.
 * try/catch: seed-scripts kjører Payload utenfor Next-kontekst, der
 * revalidateTag kaster — da lar vi cachen utløpe av seg selv.
 */
function revalidateCms(): void {
  try {
    revalidateTag("cms", "max");
  } catch {
    // Utenfor Next-kontekst (f.eks. seed-script) — cachen utløper selv.
  }
}

export const revalidateCmsAfterChange = () => {
  revalidateCms();
};

export const revalidateCmsAfterDelete = () => {
  revalidateCms();
};
```

If `bun run typecheck` complains about the second argument to `revalidateTag`, match however `apps/web/globals/on-poynt-features.ts:37` compiles today (it uses `revalidateTag("features", "max")` — same signature).

**Verify**: `bun run typecheck` → exit 0.

### Step 2: Register on the nine content collections

For each in-scope collection file: add `afterChange: [revalidateCmsAfterChange]` and `afterDelete: [revalidateCmsAfterDelete]` to the existing `hooks` object (create the `hooks` object if the collection has none; extend it if it already has `beforeChange` etc. — never remove existing hooks).

**Verify**: `grep -l "revalidateCmsAfterChange" apps/web/collections/*.ts | wc -l` → 9; `bun run typecheck` → exit 0.

### Step 3: Register on the nine public globals

Same for the globals (afterChange only — globals have no delete): Homepage, BlogPage, PodcastPage, ProductsPage, ServicesPage, Header, Footer, SiteSettings, CheckoutSettings.

**Verify**: `grep -l "revalidateCmsAfterChange" apps/web/globals/*.ts | wc -l` → 9 (OnPoyntFeatures NOT among them); `bun run typecheck` → exit 0.

### Step 4: Confirm seed-script safety and full verification

Seed scripts (e.g. `apps/web/scripts/seed-on-poynt.ts`) run Payload outside Next — the try/catch in Step 1 must swallow that. Read one seed script to confirm it calls `payload.update`/`create` on an in-scope collection or global; the hook will fire there.

**Verify**: `bun run typecheck`, `bun run check:ci` (autofix with `bun run check` if needed), and if plan 001 landed, `bun run test` — all exit 0.

Manual smoke for the operator (document, do not block): `bun run dev`, edit a page title in `/admin`, save, reload the public page — the change must appear immediately instead of after the minutes-long cache window.

## Test plan

No new automated tests — the hook body is a one-line framework call guarded by try/catch, and Payload hook execution isn't testable without a running Payload instance. The manual smoke in Step 4 is the behavioral verification. (If a Payload test harness is ever added, cover: afterChange fires revalidateTag with "cms".)

## Done criteria

- [ ] `apps/web/lib/revalidate-cms.ts` exists with the try/catch guard
- [ ] `grep -rn 'revalidateTag("cms"' apps/web/lib/revalidate-cms.ts` → exactly 1 match, and it is the only `"cms"` revalidation site in the repo
- [ ] 9 collection files + 9 global files import and register the hooks (greps from Steps 2–3)
- [ ] `apps/web/globals/on-poynt-features.ts` is unmodified (`git diff --name-only` does not list it)
- [ ] `bun run typecheck` and `bun run check:ci` exit 0
- [ ] `git status` shows no files modified outside the in-scope list
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `revalidateTag` cannot be imported into a Payload collection config module (build error about server-only context) — the hooks may then need to live behind a dynamic import; report the exact error instead of restructuring.
- A collection file in scope doesn't exist under the expected name and you cannot locate it by its slug in `payload.config.ts` imports.
- Typecheck rejects the two-argument `revalidateTag` call AND the exemplar in `on-poynt-features.ts` uses something different from what this plan shows (drift).

## Maintenance notes

- Every future content collection or public global MUST register these hooks — this is the review checklist item this plan creates. Consider (later) a factory that wraps `CollectionConfig` to apply them automatically.
- If content volume grows and full-tag invalidation gets too coarse (every save flushes every public page), the follow-up is per-collection tags (`cms:blog-posts` etc.) — the helper is the single place to extend.
- The `media` collection hook means every image upload flushes the public cache; acceptable now, revisit if the partner does bulk uploads.
