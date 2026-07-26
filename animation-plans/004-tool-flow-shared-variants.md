# 004 — Samle verktøy-flytenes framer-varianter på motion-tokens

- **Status**: DONE (utført 2026-07-26; motion-variants.ts fantes allerede — de nye eksportene ble lagt til der)
- **Commit**: 4d57496
- **Severity**: MEDIUM
- **Category**: Easing & duration + Cohesion & tokens
- **Estimated scope**: 5 files (+1 new), ~40 lines

## Problem

The three On Poynt tool flows each hand-roll the same `fadeIn` variant — 400ms (over the <300ms UI budget for a step swap in a daily tool) with **no easing specified**, so framer-motion falls back to its default instead of the entrance-appropriate strong ease-out. Two result views additionally re-implement the `Reveal` primitive inline with off-token values. The repo has one motion grammar (`easeSoft` + `duration` in `@poynt/ui/motion`, per `docs/DESIGN-PLAN.md` §3) and these five files all bypass it with copy-pasted near-duplicates that will keep drifting.

```tsx
// apps/web/app/(on-poynt)/on-poynt/(app)/verktoy/markedsplan/marketing-plan-client.tsx:68-72 — current
// (identical in kanalveileder/channel-guide-client.tsx:33-37 and arsplanlegger/yearly-planner-client.tsx:132-136)
const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
```

```tsx
// apps/web/components/channel-guide/guide-result.tsx:205-208 — current
// (identical in apps/web/components/marketing-plan/plan-result.tsx:42-45)
const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};
```

## Target

One shared module, consumed by all five files:

```tsx
// apps/web/lib/motion-variants.ts — NEW FILE
import { duration, easeSoft, revealRise } from "@poynt/ui/motion";

/** Stegbytte i verktøy-flytene (intro → skjema → resultat). Rask inn, raskere ut. */
export const stepFade = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easeSoft },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: easeSoft } },
} as const;

/** Seksjons-reveal i resultatvisninger — samme grammatikk som <Reveal>. */
export const sectionReveal = {
  initial: { opacity: 0, y: revealRise },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: easeSoft },
} as const;
```

Exact values: `duration.fast` = 0.2s entrance (was 0.4), 0.15s exit (system responds faster than it enters), `easeSoft` = `[0.22, 1, 0.36, 1]`, `revealRise` = 16. `sectionReveal` at 0.25s replaces the 0.35s inline copies — result sections appear as the AI streams, so they fire repeatedly and belong under the 300ms UI budget, not at the 500ms marketing `duration.base`.

## Repo conventions to follow

- Tokens import from `@poynt/ui/motion` (exemplar: `apps/web/components/page-hero.tsx:9`). Never retype the cubic-bezier.
- Comments in Norwegian bokmål, matching the style in `packages/ui/components/motion/motion-tokens.ts`.
- `apps/web/lib/` is the home for app-level shared helpers (e.g. `apps/web/lib/membership.ts`).

## Steps

1. Create `apps/web/lib/motion-variants.ts` with the target content above.
2. In each of `marketing-plan-client.tsx`, `channel-guide-client.tsx`, `yearly-planner-client.tsx`: delete the local `fadeIn` const, add `import { stepFade } from "@/lib/motion-variants";` (match the file's existing alias style for `apps/web/lib` imports — check its other imports), and replace every `variants={fadeIn}` with `variants={stepFade}`.
3. In `guide-result.tsx` and `plan-result.tsx`: delete the local `sectionMotion` const, import `sectionReveal`, and replace every `{...sectionMotion}` / `sectionMotion` usage with `sectionReveal`.
4. While in `guide-result.tsx:228` and `plan-result.tsx:203`: if a `transition={{ duration: 0.25 }}` (status-label fade) exists, add `ease: easeSoft` to it (import `easeSoft` from `@poynt/ui/motion`) — keep the 0.25 duration.

## Boundaries

- Do NOT touch `planner-result.tsx` or `planner-calendar.tsx` (plan 005 owns those).
- Do NOT change which elements animate, `AnimatePresence` structure, keys, or layout.
- Do NOT move the variants into `packages/ui` — they are app-level compositions of the package's tokens.
- If a file's local variant differs from the excerpt (drift since 4d57496), STOP for that file and report.

## Verification

- **Mechanical**: `bun run typecheck` + `bun run check:ci` pass. `grep -rn "const fadeIn\|const sectionMotion" apps/web --include="*.tsx"` → no hits.
- **Feel check**: run a tool end-to-end (`/on-poynt/verktoy/markedsplan`):
  - Step changes (intro → skjema → resultat) feel snappy — content is readable the instant it lands, no floaty 400ms drift.
  - Outgoing step clears slightly faster than the incoming one arrives.
  - Result sections rise in with the same "hand" as the marketing site's reveals (same curve, shorter travel time).
- **Done when**: all five files consume `apps/web/lib/motion-variants.ts`, and no inline `duration: 0.4` / `duration: 0.35` variant objects remain in the tool flows.
