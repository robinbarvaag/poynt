# Komposisjon — hvordan det visuelle systemet går igjen i hele appen

Komplement til [DESIGN.md](DESIGN.md) (reglene) og [DESIGN-PLAN.md](DESIGN-PLAN.md)
(signatur + bevegelse). Dette dokumentet svarer på ett spørsmål:

> Når vi har farger, spacing, former og bevegelse — **hvordan brukes det
> konsistent gjennom hele løsningen, uten å bli overkill?**

## Kjerneinnsikt: alt er blokker

Sidene i appen bygges av Payload-**blokker** (`apps/web/blocks/*` + render via
`apps/web/components/render-blocks.tsx`). I dag styrer hver blokk sin egen
bakgrunn og spacing ad-hoc (hardkodet `py-8`, egne `<section>`-er). Det er
derfor det ikke henger sammen.

**Prinsipp:** den visuelle behandlingen (bakgrunn, spacing, bevegelse, dekor)
bestemmes **sentralt i blokk-rendereren — ikke inne i hver blokk.** Da går
rytmen automatisk igjen på hver side, og en blokk trenger bare bry seg om sitt
eget innhold.

## 1. `BlockSection` — én innpakning rundt hver blokk

Vi lager én wrapper som `RenderBlocks` legger rundt hver blokk:

```
<BlockSection background={...} spacing="md" reveal>
   <blokkens innhold, kun Container + innhold>
</BlockSection>
```

`BlockSection` har ansvaret for:
- **Bakgrunn** (full-bredde fargeseksjon) — fra rytme-regelen under
- **Spacing** (fast vertikal rytme via `Section spacing`)
- **Reveal** (subtil scroll-inn, se §4)

Blokkene blir da «innholds-only»: de slutter å rendre egne `<section>`/`py-*`.

## 2. Fargerytme — panelene bærer fargen, bakgrunnen er jevn

Mål: liv uten støy. Siden har **én jevn, lys bakgrunn** hele veien — ingen
fullbredde-fargeseksjoner og ingen veksel-tint. Fargen kommer fra innholdet:

- **Fargede kort** (path-/produkt-/feature-kort) — de kan være mange.
- **Flytende fargepaneler** (`Panel`-primitivet: avrundet, mettet flate med
  skygge — Tall-bånd «bånd», CTA «farget», Nyhetsbrev) — de er rasjonert:
  - **Maks to fargepaneler per side.**
  - **Aldri to paneler rett etter hverandre** — legg en rolig seksjon mellom.
- Trenger en side flere tall-/CTA-øyeblikk, bruk de panel-frie variantene
  (Tall-bånd «delt», CTA «enkel») — de ligger på sidens vanlige bakgrunn.

Komposisjonssjekken i admin (se §8) vokter disse reglene live mens en bygger.

## 3. Signatur og dekor — redaksjonelt, ikke former

Det unike grepet vårt er **redaksjonelt**: en fin korn-/papirtekstur over alt,
og litt asymmetriske layouts. Vi bruker **ikke** formede seksjons-overganger
(wave/curve-dividers) — de er bevisst fjernet, både fordi de blir overkill og
fordi grepet er for lett å kjenne igjen fra andre prosjekter.

- **Korn-tekstur** (`Grain`): den alltid-på signaturen. Legges globalt **én
  gang** i layouten (`<Grain fixed />`), svært lav opacity. Gir en taktil,
  trykt følelse uten å konkurrere med innholdet.
- **Asymmetri:** der en blokk har et naturlig motvektselement (bilde, tall,
  marginalia), la innholdet sitte litt av-senter med ujevne kolonneforhold
  (f.eks. 4/7) i stedet for alltid å midtstille. Ren prosa uten motvekt
  midtstilles fortsatt — asymmetri uten motvekt ser bare ut som en feil.
- **Organiske blobs** (`FloatingShapes`, `DriftingBlob`): kun på utvalgte
  flater — hero og den ene farge-/CTA-seksjonen. Aldri på vanlige
  innholdsblokker. Alltid lav opacity, bak innholdet.
- Tommelfingerregel: korn-teksturen er overalt og umerkelig; alt annet dekor
  ser du maks ett av i viewporten samtidig.

## 4. Bevegelse — på blokk-nivå, konsistent

- Hver blokks innhold pakkes i `Reveal` (fade + glid inn) via `BlockSection`.
  Da får hele appen samme subtile scroll-inn uten at noen blokk gjør noe selv.
- Lister/kort-rader bruker `Stagger`.
- Parallax/`DriftingBlob` kun på dekor i hero/CTA.
- Respekter alltid `prefers-reduced-motion` (primitivene gjør det allerede).

## 5. Spacing og bredde — fast rytme overalt

- Seksjonsavstand kommer kun fra `BlockSection` (default `spacing="lg"`) —
  **ikke** noe en blokk styrer selv. Én verdi, hele siden.
- Avstand mellom elementer fra `Stack gap`.
- **Én innholdsbredde:** alle blokker bruker `Container` (default
  `max-w-6xl`) — **aldri** Tailwinds `container`-klasse (den er bredere og var
  årsaken til at seksjonene hadde ulik bredde). Smalere mål (`max-w-2xl`/`3xl`)
  er kun lov for løpende tekst *inne i* containeren, venstrestilt.
- Ingen vilkårlige `py-`/`gap-`-verdier i blokkene.

## 5b. Justering — venstrekanten er limet

- Seksjonshoder rendres av **`SectionHeader`**-primitivet (eyebrow + tittel +
  ingress) og er **venstrestilte som default**. Da deler alle seksjoner samme
  venstrekant, og siden leses som ÉN komposisjon.
- Sentrering er unntaket og et bevisst valg: hero, innhold inni fargepaneler
  (CTA/nyhetsbrev/tall-bånd «bånd») og stor-sitat-varianten av anmeldelser.
- Ikke lag egne eyebrow/tittel/ingress-stabler i blokkene — bruk primitivet.

## 6. Faseplan for å rulle dette ut

- **Fase A — fundament:** lag `BlockSection` + rytme-funksjonen i `RenderBlocks`.
  Flytt bakgrunn/spacing/reveal dit. (Liten, sentral endring.)
- **Fase B — rydd blokkene:** fjern hardkodet `<section>`/`py-*` fra hver
  `*-block.tsx`; de blir innholds-only. Én blokk om gangen.
- **Fase C — dekor-aksenter:** legg blobs på hero + CTA etter §3.
- **Fase D — signatur:** global korn-tekstur (`<Grain fixed />`) + asymmetri på
  blokker med naturlig motvekt.
- **Fase E — Payload-styring (valgfritt):** `background`-felt per blokk så
  partneren kan overstyre rytmen.

## 7. CTA-rasjonering — ett mål per side

En side selger ETT hovedmål (f.eks. On Poynt-medlemskap). Regler:

- Maks én blokk med hovedknapp mot samme URL. Andre seksjoner kan omtale
  tilbudet, men uten egen knapp — hierarkiet kollapser når fem seksjoner
  roper det samme.
- Hero øverst (én), nyhetsbrev nederst (ett).

## 8. Komposisjonssjekken i admin

Reglene i §2, §5 og §7 voktes av **Komposisjonssjekk**-panelet øverst i
Sidelayout på Sider og Forside (`apps/web/admin/components/composition-check.tsx`).
Den er regelbasert (ingen AI), kjører live mens en redigerer, og gir
advarsler/tips — den blokkerer aldri lagring. Søsteren til
AI-kvalitetsvurderingen på Guider. Nye komposisjonsregler legges til der,
slik at retningslinje og vakt aldri glir fra hverandre.

## 9. Hva vi IKKE gjør

- Ikke formede seksjons-overganger (wave/curve-dividers).
- Ikke ny bakgrunnsfarge på hver blokk.
- Ikke organiske blobs på vanlige innholdsblokker.
- Ikke asymmetri på ren prosa uten motvekt.
- Ikke bevegelse som forsinker lesing eller hindrer scroll.

> Kort sagt: **systemet (farge-rytme + spacing + reveal + korn-tekstur) er
> overalt og automatisk; flørten (blobs, asymmetri) er sjelden og bevisst.**
