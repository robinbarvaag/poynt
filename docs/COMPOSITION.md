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

## 2. Fargerytme — subtil, regelstyrt

Mål: liv uten støy. **Mest lyst, lett veksling.** Ikke ny farge på hver seksjon.

Regler:
- Standard bakgrunn er lys (`background`). De fleste blokker er lyse.
- Annenhver «tunge» blokk kan få en dempet flate (`muted` eller `secondary`).
- **Maks én** sterk farget seksjon (`primary`/`accent`) per side — typisk CTA.
- Aldri to sterke farger rett etter hverandre.

Dette beregnes ett sted (en liten funksjon i `RenderBlocks` som tar
blokk-index + type → bakgrunn), så hele appen følger samme rytme.

Senere kan partneren overstyre per blokk i Payload (et `background`-felt:
auto / lys / dempet / farget), med «auto» som default.

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

## 5. Spacing — fast rytme overalt

- Seksjonsavstand kommer kun fra `Section spacing` (sm/md/lg/xl).
- Avstand mellom elementer fra `Stack gap`.
- Bredder fra `Container size`.
- Ingen vilkårlige `py-`/`gap-`-verdier i blokkene.

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

## 7. Hva vi IKKE gjør

- Ikke formede seksjons-overganger (wave/curve-dividers).
- Ikke ny bakgrunnsfarge på hver blokk.
- Ikke organiske blobs på vanlige innholdsblokker.
- Ikke asymmetri på ren prosa uten motvekt.
- Ikke bevegelse som forsinker lesing eller hindrer scroll.

> Kort sagt: **systemet (farge-rytme + spacing + reveal + korn-tekstur) er
> overalt og automatisk; flørten (blobs, asymmetri) er sjelden og bevisst.**
