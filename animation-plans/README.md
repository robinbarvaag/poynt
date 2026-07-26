# Animation plans

Produced by the `improve-animations` audit at commit `4d57496` (2026-07-26). Each plan is self-contained — an executor needs no other context. Run with `improve-animations execute <plan>` or hand to any agent.

## Plans

| # | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | [Fjern scale(0)-bounce på tool-form-ikonene](001-tool-form-icon-pop.md) | HIGH | EXECUTED — approved, awaiting merge |
| 002 | [Fjern hover-scale på høyfrekvente valgkort](002-option-card-hover.md) | HIGH | DONE — applied to working tree 2026-07-26 |
| 003 | [Stopp layout-animasjoner og gate hover-transformer](003-layout-transitions-and-motion-safe.md) | HIGH | DONE — applied to working tree 2026-07-26, review-approved |
| 004 | [Samle verktøy-flytenes framer-varianter på motion-tokens](004-tool-flow-shared-variants.md) | MEDIUM | DONE |
| 005 | [Årshjulet: scale(0) bort, stagger inn, hover roet ned](005-planner-month-wheel.md) | MEDIUM | DONE — applied to working tree 2026-07-26, review-approved |

## Execution order & dependencies

Recommended order: **001 → 002 → 003 → 004 → 005** (leverage order). No hard dependencies — each plan touches a disjoint file set and can run independently or in parallel worktrees:

- 002 owns `option-card.tsx` + `guide-quiz.tsx`; 003 explicitly excludes them.
- 003 excludes `planner-result.tsx`; 005 owns it.
- 004 owns the tool-client + result files; 005 owns `planner-result.tsx`/`planner-calendar.tsx`.

## Audit findings not (yet) planned

Lower-leverage items confirmed in the audit, available for future plans:

- `DriftingBlob` runs an infinite main-thread framer animation on a ~40px `blur-2xl` layer (`packages/ui/components/motion/drifting-blob.tsx:24-40`) — consider a CSS keyframe + reduced blur.
- "Flere valg" in `apps/web/components/marketing-plan/plan-form.tsx:327-331` animates open but hard-cuts closed (no `AnimatePresence`/`exit`); also animates `height: auto`.
- Chat messages in fellesskap teleport in — a small fade+rise on arrival (`packages/ui/components/chat/message.tsx`) is the one confirmed *missed opportunity*.
- `message-scroller.tsx:104` hand-types `cubic-bezier(0.23,1,0.32,1)` — a near-clone of `--ease-soft` (registry-imported; low).
- Press feedback (`pressable`) missing on dialog/sheet close buttons and community reaction chips.
- Accordion expand/collapse is keyframe-driven (restarts on rapid toggling) — standard Radix tradeoff, non-trivial fix.
- Remaining low-impact `transition-all` sites where only colors change (button, tabs, switch, composer, category-filter, pricing-cards, …).
