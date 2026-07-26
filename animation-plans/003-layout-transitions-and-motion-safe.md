# 003 — Stopp layout-animasjoner og gate hover-transformer

- **Status**: DONE — applied to working tree 2026-07-26, review-approved
- **Commit**: 4d57496
- **Severity**: HIGH
- **Category**: Performance + Accessibility
- **Estimated scope**: 8 files, ~15 lines

## Problem

Two intertwined issues across marketing and member-app components:

1. **Hover states animate layout properties** (`width`, `gap`) via `transition-all` — these force layout + paint every frame instead of staying on the compositor. Only `transform` and `opacity` should animate.
2. **Hover/scale transforms are not gated by `prefers-reduced-motion`** — the repo's CSS utilities (`pressable`, `swap-in`, shimmer in `tooling/tailwind/web.css`) and all framer primitives gate motion correctly; these ad-hoc Tailwind hover transforms are the gap. (Tailwind v4's `hover:` variant already only applies on hover-capable devices, so only the reduced-motion gate is missing — use the `motion-safe:` variant.)

Current code:

```tsx
// packages/ui/components/marketing/feature-grid.tsx:149 — animates WIDTH (w-9 → w-full)
<span aria-hidden="true" className="h-0.75 w-9 rounded-full bg-current transition-all duration-300 ease-out group-hover/card:w-full" />
```

```tsx
// packages/ui/components/marketing/service-showcase.tsx:120 — animates GAP
"...text-sm transition-all group-hover:gap-2.5"
// service-showcase.tsx:163 and :171 — "...transition-all hover:gap-3"
// packages/ui/components/marketing/service-card.tsx:90 — "...transition-all group-hover/service:gap-2.5"
// packages/ui/components/marketing/path-card.tsx:139 — "mt-8 inline-flex items-center gap-2 pt-2 font-bold text-sm transition-all group-hover/path:gap-3.5"
```

```tsx
// apps/web/components/planner/tasks/tasks-card.tsx:163-166 — animates WIDTH of a progress fill, 500ms
<div
  className="h-full bg-primary transition-all duration-500"
  style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }}
/>
```

```tsx
// packages/ui/components/card.tsx:14 — unscoped transition-all default on EVERY card
"... shadow-sm transition-all duration-300 hover:shadow-md ..."
// packages/ui/components/dashboard/toolbox-card.tsx:33 — "group h-full p-0 transition-all hover:-translate-y-0.5"
// packages/ui/components/guide/download-card.tsx:41 — "...transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
// apps/web/components/footer.tsx:147 — "...transition-all duration-300 hover:scale-110"
```

## Target

**A. Width/gap hovers become transform-based:**

```tsx
// feature-grid.tsx:149 — target: full-width bar revealed by scaling, not width
<span aria-hidden="true" className="h-0.75 w-full origin-left scale-x-25 rounded-full bg-current transition-transform duration-300 ease-out motion-safe:group-hover/card:scale-x-100" />
```

(`scale-x-25` starts the bar at 25% of the container ≈ the old `w-9` look; adjust to `scale-x-20` if the resting bar looks too long in place — the resting length is a judgment call, the mechanism is not.)

```tsx
// gap-hovers — target pattern (all 5 sites): keep gap static, move the trailing arrow icon instead.
// 1) delete `group-hover*:gap-*` / `hover:gap-*` from the row's className
// 2) change the row's `transition-all` → `transition-colors`
// 3) on the trailing icon inside the row (ArrowRight/ChevronRight or similar), add:
"transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
// (match the existing group name: group-hover/card:, group-hover/service:, group-hover/path:, or plain hover on non-group sites — mirror what the gap utility used)
```

**B. Progress fill animates transform, not width:**

```tsx
// tasks-card.tsx — target (mirrors packages/ui/components/progress.tsx:22)
<div
  className="h-full w-full bg-primary transition-transform duration-200 ease-soft"
  style={{ transform: `translateX(-${100 - (total ? (doneCount / total) * 100 : 0)}%)` }}
/>
```

(The parent at line 162 already has `overflow-hidden rounded-full` — required for this pattern; keep it.)

**C. Scope the remaining `transition-all` + gate transforms:**

```tsx
// card.tsx:14: transition-all duration-300 → transition-[box-shadow,border-color,background-color] duration-300
// toolbox-card.tsx:33: transition-all hover:-translate-y-0.5 → transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5
// download-card.tsx:41: transition-all duration-300 hover:-translate-y-0.5 → transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5
// footer.tsx:147: transition-all duration-300 hover:scale-110 → transition-[transform,color,background-color] duration-300 motion-safe:hover:scale-105
```

(Footer social icons also drop from `scale-110` to `scale-105` — 10% growth is over-animated for a hover per the press/hover subtlety band 0.95–1.05.)

## Repo conventions to follow

- `ease-soft` and `duration-200` are the repo tokens (`tooling/tailwind/web.css:88,92`); `ease-out` maps to Tailwind's builtin and is already used at `feature-grid.tsx:149` — keep whichever the line already uses.
- Transform-based progress exemplar: `packages/ui/components/progress.tsx:22` (`translateX(-${100 - value}%)` on a full-width bar inside `overflow-hidden`).
- Reduced-motion philosophy (`tooling/tailwind/web.css:295-303` `pressable`): movement is dropped, color/opacity feedback kept — `motion-safe:` on the transform utility achieves exactly this, since colors/shadows still transition.

## Steps

1. `packages/ui/components/marketing/feature-grid.tsx:149`: apply target A (scale-x bar).
2. `packages/ui/components/marketing/service-showcase.tsx:120,163,171`, `service-card.tsx:90`, `path-card.tsx:139`: apply the gap→icon-translate pattern (target A). Open each site, find the trailing icon element inside the same flex row, and move the motion there.
3. `apps/web/components/planner/tasks/tasks-card.tsx:163-166`: apply target B.
4. `packages/ui/components/card.tsx:14`, `packages/ui/components/dashboard/toolbox-card.tsx:33`, `packages/ui/components/guide/download-card.tsx:41`, `apps/web/components/footer.tsx:147`: apply target C line-for-line.

## Boundaries

- Do NOT touch `apps/web/components/yearly-planner/planner-result.tsx` (plan 005 owns that file) or `option-card.tsx`/`guide-quiz.tsx` (plan 002).
- Do NOT restructure markup except where target A explicitly moves a utility onto the existing icon element — never add wrapper elements.
- Do NOT edit `apps/storybook` stories; if a story mirrors the old feature-grid pattern it can drift until the next storybook pass.
- Do NOT change hover colors/shadows — only what property animates and whether transforms are motion-safe-gated.
- If a cited line doesn't match (drift since 4d57496), STOP and report that file, continue with the others.

## Verification

- **Mechanical**: `bun run typecheck` + `bun run check:ci` pass. `grep -rn "hover:gap-\|group-hover.*:gap-" packages/ui apps/web --include="*.tsx"` → no hits (excluding `.claude/`). `grep -n "transition-all" packages/ui/components/card.tsx apps/web/components/planner/tasks/tasks-card.tsx` → no hits.
- **Feel check**:
  - Marketing pages (forside, /tjenester): hover a feature card — the accent bar still grows to full width, from the left, smoothly; link rows still nudge their arrow on hover. In DevTools Performance panel, hovering no longer produces purple Layout blocks per frame.
  - Planner tasks card: checking a task animates the progress fill smoothly (~200ms), sliding rather than resizing.
  - Rendering panel → `prefers-reduced-motion: reduce`: card lifts, arrow nudges, and bar growth stop moving; color/shadow hover feedback remains.
- **Done when**: no hover-animated `width`/`gap` remains, listed `transition-all` sites are scoped, and every hover transform in the listed files carries `motion-safe:`.
