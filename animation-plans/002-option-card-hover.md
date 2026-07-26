# 002 — Fjern hover-scale på høyfrekvente valgkort

- **Status**: DONE (2026-07-26 — executed via worktree agent, diff reviewed and applied)
- **Commit**: 4d57496
- **Severity**: HIGH
- **Category**: Purpose & frequency + Performance + Accessibility
- **Estimated scope**: 2 files, ~4 lines

## Problem

`OptionCard` is the core selectable in every On Poynt tool form (channels, industry, size, quiz answers) — hovered and clicked tens of times per day by every member. It carries a decorative `hover:scale-[1.02]` lift via unscoped `transition-all`. Per the frequency rule, elements hit tens of times/day should have hover motion removed or drastically reduced; the scale wobble on the primary daily input makes the tools feel fidgety, and `transition-all` animates every property that changes (ring, border, background on selection) instead of only the intended ones. The quiz answer buttons in the channel guide repeat the same pattern.

```tsx
// packages/ui/components/tool-form/option-card.tsx:36-42 — current
className={cn(
  "w-full text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
  isSelected
    ? "ring-2 ring-primary bg-primary/5 border-primary"
    : "hover:border-primary/50",
  className
)}
```

```tsx
// apps/web/components/channel-guide/guide-quiz.tsx:377 — current (same pattern)
"... transition-all duration-200 hover:scale-[1.02] ..."
```

(Read the full className at that line before editing; only the two utilities named below change.)

## Target

No transform on hover. Hover feedback stays, but as cheap, scoped color/shadow transitions only:

```tsx
// target — option-card.tsx
"w-full text-left transition-[border-color,background-color,box-shadow] duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
```

Concretely: replace `transition-all` with `transition-[border-color,background-color,box-shadow]` and delete `hover:scale-[1.02]`. Everything else in the className stays identical. Same two edits in `guide-quiz.tsx:377` (keep whatever other utilities are on that line).

Note: `box-shadow` must stay in the transition list so `hover:shadow-md` still eases, and `ring` is composited via `box-shadow` in Tailwind — selection ring changes will also transition smoothly.

## Repo conventions to follow

- `duration-200` maps to the repo token `--duration-fast` (`tooling/tailwind/web.css:92`) — keep it.
- Press feedback is a separate concern handled by the `pressable` utility (`tooling/tailwind/web.css:295-303`); do not add or remove it here.
- Exemplar of a scoped transition already in the repo: `packages/ui/components/site-header.tsx:221` — `transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out`.

## Steps

1. `packages/ui/components/tool-form/option-card.tsx:37`: in the first string of the `cn(...)` call, change `transition-all` → `transition-[border-color,background-color,box-shadow]` and remove `hover:scale-[1.02] `.
2. `apps/web/components/channel-guide/guide-quiz.tsx:377`: same two changes (`transition-all` → `transition-[border-color,background-color,box-shadow]`, delete `hover:scale-[1.02]`), leaving all other utilities on the line untouched.

## Boundaries

- Do NOT touch the `isSelected` styling, focus-visible ring, or markup.
- Do NOT change `hover:shadow-md` or `hover:border-primary/50` — the hover cue survives, only the movement goes.
- Do NOT edit any other component that uses hover scale (those belong to plan 003).
- If the strings at these lines don't match the excerpts (drift since 4d57496), STOP and report.

## Verification

- **Mechanical**: `bun run typecheck` and `bun run check:ci` pass; `grep -rn "hover:scale" packages/ui/components/tool-form apps/web/components/channel-guide` returns nothing.
- **Feel check**: open `/on-poynt/verktoy/kanalveileder`, sweep the cursor across the option cards quickly:
  - Cards no longer grow — hover reads as a border/shadow highlight, calm even when strafing across the list.
  - Clicking a card still shows the selected ring + background instantly and smoothly.
  - On a touch device (or DevTools device emulation), tapping doesn't leave a stuck hover state that moves the card.
- **Done when**: no `hover:scale` and no `transition-all` remain in the two files, and hover/selection feedback still visibly eases.
