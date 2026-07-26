# 001 — Fjern scale(0)-bounce på tool-form-ikonene

- **Status**: EXECUTED — approved, awaiting merge from worktree `worktree-agent-aa4e3a75b8b16481e`
- **Commit**: 4d57496
- **Severity**: HIGH
- **Category**: Physicality & origin + Cohesion
- **Estimated scope**: 2 files, ~10 lines

## Problem

The step icon and form-header icon in every On Poynt tool form (kanalveileder, markedsplan, årsplanlegger — used daily by members) animate in from `scale: 0` with an underdamped, visibly overshooting spring. Two rules broken: nothing should appear from `scale(0)` (nothing in the real world appears from nothing), and the repo's documented motion grammar is explicitly "myk easing uten bounce" (`packages/ui/components/motion/motion-tokens.ts:5`) — a bouncy pop on every step of a daily-use tool contradicts the crisp member-app personality. There is also no reduced-motion handling.

```tsx
// packages/ui/components/tool-form/step-container.tsx:61-68 — current
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
  className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary"
>
  <Icon name={stepIcon} className="size-6" />
</motion.div>
```

```tsx
// packages/ui/components/tool-form/form-header.tsx:26-37 — current
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
  className={cn(
    "size-16 rounded-2xl flex items-center justify-center",
    iconBgColor,
    iconColor
  )}
>
```

## Target

Both icons enter with a subtle scale-up from 0.95 + fade, using the repo's shared motion tokens (no bounce), and drop the scale movement under reduced motion (keep the fade):

```tsx
// target (identical pattern in both files)
const reduce = useReducedMotion();
// ...
<motion.div
  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
  transition={{ duration: duration.fast, ease: easeSoft }}
  className={/* unchanged */}
>
```

Exact values: `duration.fast` = `0.2` (seconds), `easeSoft` = `[0.22, 1, 0.36, 1]` — both imported, never retyped.

## Repo conventions to follow

- Motion tokens live in `packages/ui/components/motion/motion-tokens.ts` and are exported from the `@poynt/ui/motion` barrel (`packages/ui/components/motion/index.ts:3`). Inside `packages/ui`, import them with a relative path: `import { duration, easeSoft } from "../motion/motion-tokens";`
- Exemplar for the reduced-motion branch: `packages/ui/components/motion/reveal.tsx` — it calls `useReducedMotion()` from `framer-motion` and drops the movement while keeping the opacity fade.
- Exemplar for a compliant icon entrance: `packages/ui/components/checkbox.tsx:54-61` (starts at `scale: 0.5` — never 0 — and branches on `useReducedMotion`).

## Steps

1. `packages/ui/components/tool-form/step-container.tsx`: add `useReducedMotion` to the existing `framer-motion` import and `import { duration, easeSoft } from "../motion/motion-tokens";`. Add `const reduce = useReducedMotion();` at the top of the component. Replace lines 62–64 (`initial`/`animate`/`transition`) with the target block above. Leave `className` and children untouched.
2. `packages/ui/components/tool-form/form-header.tsx`: same change at lines 27–29 (same imports, same `reduce` const, same target block).

## Boundaries

- Do NOT touch any other `motion.div` in these files or elsewhere in `tool-form/`.
- Do NOT change markup, classNames, or props — motion values only.
- Do NOT add dependencies; `framer-motion` is already a dependency of `@poynt/ui`.
- If the code at these lines doesn't match the excerpts (drift since 4d57496), STOP and report instead of improvising.

## Verification

- **Mechanical**: `bun run typecheck` and `bun run check:ci` from the repo root — both pass.
- **Feel check**: open any On Poynt tool (e.g. `/on-poynt/verktoy/kanalveileder`), step through the form:
  - The step icon fades/scales in quickly and settles with **no overshoot/bounce** — it should read as "appears", not "pops".
  - In DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: the icon still fades in, but no scale movement.
  - Set Animations panel playback to 10%: entrance starts at ~95% size, never from a dot.
- **Done when**: both icons use `duration.fast` + `easeSoft`, no `type: "spring"` or `scale: 0` remains in either file, and reduced-motion drops scale but keeps the fade.
