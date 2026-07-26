# 005 — Årshjulet: scale(0) bort, stagger inn, hover roet ned

- **Status**: DONE — applied to working tree 2026-07-26, review-approved
- **Commit**: 4d57496
- **Severity**: MEDIUM
- **Category**: Physicality & origin + Cohesion & tokens
- **Estimated scope**: 1 file, ~20 lines

## Problem

The yearly-planner month wheel (12 circles) has three issues in one file:

1. Every circle enters from `scale: 0` — appearing from nothing — with a raw, off-token `duration: 0.3` and no easing.
2. All 12 fire simultaneously; a wheel is the canonical case for a small stagger resolving around the circle, and the repo ships `staggerStep` for exactly this.
3. The circle hover uses unscoped `transition-all` with `hover:scale-110` — a 10% jump, ungated for reduced motion.

```tsx
// apps/web/components/yearly-planner/planner-result.tsx:334-338 — current (placeholder branch)
<motion.div
  key={`slot-${monthNumber}`}
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
```

```tsx
// planner-result.tsx:362-367 — current (planned-month branch, same pattern)
<motion.div
  key={`slot-${monthNumber}`}
  initial={{ opacity: 0, scale: 0 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
```

```tsx
// planner-result.tsx:374 — current (inner circle)
"relative flex size-20 flex-col items-center justify-center rounded-full border-2 text-foreground transition-all duration-300 hover:scale-110 hover:border-primary hover:shadow-lg sm:size-24",
```

## Target

```tsx
// target — both motion.div branches (334 and 362); monthNumber is 1-based in this map
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{
  duration: duration.fast,
  ease: easeSoft,
  delay: (monthNumber - 1) * (staggerStep / 2),
}}
```

```tsx
// target — inner circle className at 374
"relative flex size-20 flex-col items-center justify-center rounded-full border-2 text-foreground transition-[transform,border-color,box-shadow,background-color] duration-300 motion-safe:hover:scale-105 hover:border-primary hover:shadow-lg sm:size-24",
```

Exact values: `duration.fast` = 0.2, `easeSoft` = `[0.22, 1, 0.36, 1]`, `staggerStep` = 0.07 so the per-circle delay is **35ms** (0.035s) — 12 circles resolve in ~0.6s total, decorative but never blocking (the circles are clickable immediately; delay only gates the entrance). Hover drops from 1.10 to 1.05 and becomes motion-safe.

If `monthNumber` is not directly available as a 1-based index at those call sites, use the `map` index instead — the requirement is a stable 0–11 sequence around the wheel.

## Repo conventions to follow

- Import tokens: `import { duration, easeSoft, staggerStep } from "@poynt/ui/motion";` (exemplar import style: `apps/web/components/page-hero.tsx:9`).
- The repo's `Stagger`/`StaggerItem` primitives exist (`packages/ui/components/motion/reveal.tsx`) but are built for `whileInView` scroll reveals — for this mount-triggered absolute-positioned wheel, per-item `delay` on the existing `motion.div`s is the right fit; do not force the primitives in.
- Reduced motion: framer's `y`/`scale` entrances elsewhere branch on `useReducedMotion()` (`packages/ui/components/motion/reveal.tsx`). Add `const reduce = useReducedMotion();` and when `reduce` is true use `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `delay: 0`.

## Steps

1. `apps/web/components/yearly-planner/planner-result.tsx`: add the token import and `useReducedMotion` (extend the existing `framer-motion` import).
2. Replace `initial`/`animate`/`transition` on the `motion.div` at lines 334–338 with the target (including the `reduce` branch).
3. Same replacement on the `motion.div` at lines 362–367.
4. Update the inner-circle className at line 374 per the target (scoped transition, `motion-safe:hover:scale-105`).

## Boundaries

- Do NOT touch the positioning math (`left`/`top` percentages, `-translate-x-1/2` classes), heat-map colors, `onClick`, or anything else in the file.
- Do NOT edit `planner-calendar.tsx` or the tool-client files (plan 004 territory).
- Do NOT add wrappers or restructure the map.
- If line contents differ from the excerpts (drift since 4d57496), STOP and report.

## Verification

- **Mechanical**: `bun run typecheck` + `bun run check:ci` pass; `grep -n "scale: 0[^.]" apps/web/components/yearly-planner/planner-result.tsx` → no hits.
- **Feel check**: generate a plan in `/on-poynt/verktoy/arsplanlegger` and open the wheel view:
  - Circles resolve around the wheel January → December in one quick sweep (~0.6s), each appearing from 90% size — no popping from dots.
  - Set Animations panel playback to 10%: no circle ever renders at near-zero size.
  - Hover a circle: a calm 5% lift; with `prefers-reduced-motion: reduce` emulated, no lift but border/shadow feedback remains and circles still fade in.
  - Clicking a circle mid-entrance still navigates (stagger never blocks interaction).
- **Done when**: both entrances use tokens + 35ms stagger + reduced-motion branch, and the hover is scoped, subtle, and motion-safe.
