# Verdifull Vekst-universet: interaktive blokker

> **Status:** bygget på grenen `feat/vekst-universet` (2026-09-15). Migrasjon
> `20260915_193733_vekst_blocks` er kjørt. Eksempelsiden seedes med
> `scripts/seed-vekst-eksempler.ts`. Ingenting på den eksisterende ressurssiden er endret.

## 1. Hva og hvorfor

Susanne har en ressursside til boka «Verdifull vekst» (seedet av `apps/web/scripts/seed-ressurser.ts`,
senere redigert for hånd i admin). For å gjøre den til et sted leseren **bruker**, ikke bare leser,
finnes nå sju nye blokker bygd på verktøyene i boka. De ligger i «Legg til blokk» med
«(Verdifull vekst)» i navnet og starter ferdig utfylt med bokinnhold.

Valgt bort (2026-09-15): sitatvegg, gjestestemmer, krisehistorien, lanseringsfest-teaser og
QR-koder i boka (boka er allerede i trykken).

## 2. Spilleregler

| Regel | I praksis |
|---|---|
| Ikke rør det som finnes | Bare nye blokktyper. Eksisterende blokker og sidedokumentet er urørt. |
| Seed er create-only | Eksempelsiden opprettes bare hvis den ikke finnes. Den oppdateres aldri. |
| Bokas farger | Nye blokker bruker `BOOK_PALETTE` (lilla og oliven) fra `lib/book-brand.ts`. Kan byttes til Poynt-grønt under «Utseende». |
| Én fargeskala | Bokas soner overalt: rosa = start her, gul = nummer to, grønn = sterkt (`vekst/palette.ts`). |
| Brukeren styrer bevegelsen | Animasjon ved klikk, dra og hover, aldri ved scrolling. `prefers-reduced-motion` respekteres. |
| Tallene blir hos leseren | Alt regnes i nettleseren. Spåkula, sjekklista og besøkte dører huskes i `localStorage`. |
| «KI», ikke «AI» | Susannes valg for boka og siden. Gjelder nye tekster her. |
| Bokinnhold kan ligge åpent | Spørsmål, løgner, sitater og eksempler er hentet fra manuset. |

## 3. Blokkene

| Blokk (slug) | Hva leseren gjør | Krydder |
|---|---|---|
| **Kalkulator** (`growthCalculator`) | Velg variant i admin: *Lønnsomhet*, *Timepris* eller *Spåkula for salg* | Måler med nål som svinger inn i fargesonene, stempel («Taper penger»), «Prøv Gudruns komler», dinglende prislapp, glødende spåkule med stolper mot nullpunktet |
| **Endringshjulet** (`changeWheel`) | Svarer ja/nei på bokas 12 spørsmål (4 områder × 3) | Hjulet fylles i fargesoner og roterer så det svakeste området havner øverst. «Kopier resultatet til KI» |
| **VEKST-sjekken** (`vekstCheck`) | 15 ja/nei-spørsmål, ett om gangen | Bokstavklossene V-E-K-S-T fylles som glass, den sterkeste løftes, konfetti hvis alt er ja |
| **Løgner som vendekort** (`mythCards`) | Snur kortene med bokas ti løgner | 3D-vending, stempel «Løgn #3», teller og konfetti når alle er avslørt |
| **Arbeidsflyter med KI** (`aiWorkflow`) | Velger arbeidsflyt, kjører eksempelet, kopierer eller åpner prompten | Input → prompt → resultat med prikker langs ledningene, skrivemaskin, eller chatbobler for «Ditt fiktive styre». Åpne i ChatGPT/Claude |
| **Fast salgsøkt** (`salesRitual`) | Starter Omsetnings-onsdag, huker av sjekklista, legger den i kalenderen | Kalenderbladet rives av, framdriftsring, ukentlig nullstilling, `.ics` via `/api/kalender` |
| **Kapittelportal** (`chapterPortal`) | Går inn gjennom en dør per bokstav | Døra svinger opp ved hover, besøkte dører står på gløtt med hake |

Ankrene på eksempelsiden (blokk-navnet slugifisert): `#kapitlene`, `#vekst-sjekken`, `#endringshjulet`,
`#lonnsomhet`, `#timepris`, `#spakula`, `#ti-logner`, `#arbeidsflyter-med-ki`, `#omsetnings-onsdag`.
Lenkene i standardinnholdet peker hit. Flyttes blokkene til en annen side, må blokk-navnene være de
samme, ellers må lenkene justeres i admin.

## 4. Slik havner det på den ekte siden

1. Kjør `bun run --cwd apps/web payload run scripts/seed-vekst-eksempler.ts` (én gang per miljø).
   Lager det skjulte utkastet «Verdifull Vekst-universet – nye elementer (forslag)».
2. Susanne forhåndsviser utkastet i admin.
3. På sin egen ressursside bruker hun «Legg til blokk» og velger blokkene hun vil ha. De kommer
   ferdig utfylt med bokinnholdet. Hun gir blokken et «Blokk-navn» (blir ankeret og menypunktet).

## 5. Teknisk

- **UI:** `packages/ui/components/vekst/` (eksportert fra `@poynt/ui`). Rene regnefunksjoner i
  `logic.ts` med tester (`logic.test.ts`); `use-stored-state.ts` for hydreringstrygg `localStorage`.
- **Payload-blokker:** `apps/web/blocks/{growth-calculator,change-wheel,vekst-check,myth-cards,ai-workflow,sales-ritual,chapter-portal}.ts`,
  felles felt i `vekst-fields.ts`. Registrert i `layout-blocks.ts`.
- **Adaptere:** `apps/web/components/blocks/*-block.tsx` + `vekst-palette.ts`. Registrert i `render-blocks.tsx`.
- **Bokinnhold:** `apps/web/lib/vekst/book-content.ts` er den ene kilden for standardverdier, seed og Storybook.
- **Kalender:** `apps/web/lib/vekst/ics.ts` (testet: Oslo-tid, VTIMEZONE, linjebretting) og `app/api/kalender/route.ts`.
- **Admin:** etiketter i `lib/composition-rules.ts`, ikoner/antall i `components/views/cms-page-view.tsx`,
  forhåndsbilder i `blocks/block-previews.ts` (stories under `apps/storybook/stories/Vekst/`).
- **Markdown/llms.txt:** går automatisk via blokk-skjemaene.

## 6. Gjenstår / ideer

- [ ] Susanne leser gjennom tekstene. Motsvarene til løgnene og rådene i hjulet/sjekken er skrevet ut
      fra manuset, men ikke ordrett.
- [ ] Test på mobil og med skjermleser i ekte nettleser.
- [ ] Påskeegg «Finn VEKST» (fem gjemte bokstaver som låser opp en bonus). Ikke bygget.
- [ ] Eventuelt «Send meg resultatet» på e-post fra endringshjulet/VEKST-sjekken. Ikke bygget.

## 7. Utenfor (ville endret eksisterende)

- «Åpne i ChatGPT/Claude»-knapper på den eksisterende `promptLibrary`.
- Fargesoner eller håndtegnede aksenter på eksisterende `steps` (Tom innboks).
