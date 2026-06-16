# Design — On Poynt

> Se også [DESIGN-PLAN.md](DESIGN-PLAN.md) for signatur, scroll-«reise» og konkret bevegelsesplan.

## Personlighet

<!-- Fyll inn 3-5 adjektiver som beskriver On Poynt. Eksempler: leken, modig, varm, profesjonell, jordnær -->

- Leken
- Imøtekommende
- Profesjonell
- Seriøs
- Varm

## Inspirasjon

<!-- For hver side: noter HVA du liker, ikke bare lenken. "Liker card-layouten" hjelper. Bare "fin side" hjelper ikke. -->

<!-- Eksempel:
- [Studio Freight](https://studiofreight.com) — liker den modige typografien og uventede layouten
- [Linear](https://linear.app) — clean men med personlighet gjennom animasjoner
-->

- https://reasonal.co/ - liker veldig godt scroll effekten på siden, og at nettsiden er veldig clean, og det er ikke for mye av scroll elementene. Eg hater når scroll elementene blir for mye, det må være en "kul" ting, men samtidig at det fremdeles er helt "vanlig" scroll, men at det skjer subtile animasjoner det er kult. Eg liker og at det er brukt mye farger på siden, "rolige" farger, det skaper liv uten å bli alt for mye. Liker jo hvordan en bruker hele skjermen her og.
- https://www.caide.io/ - litt det samme som den andre siden, likte footer her, eller likte animasjonen i footer, eg liker og parallax scrolling, sålenge det ikke blir alt for overkill. Men her, og, leken fargebruk, små animasjoner. Noen av cards har en "grid" bakgrunn, som var noe litt kult med, eg likte og fonten, og hvordan de brukte fonter her. Liker jo hvordan en bruker hele skjermen her og.
- https://dontboardme.com/services - Det er noe her, eg vet ikke hva, eg synes jo det blir alt for fancy, og "svært", men likte den side-transition som er i headeren der, og ja, det er jo noe "bold" med det her, som eg liker, men samtidig så er det ja, alt for fancy. Liker jo hvordan en bruker hele skjermen her og.
-https://www.lemonsqueezy.com/ egentlig det samme, bruker hele skjermen, bruker en del farger.
-bilde i inspo/header.png liker egentlig godt hvordan denne headeren ser ut, men eg tror det er mer hvor godt den passer inn med resten av designet her.
- bilde i inspo/inspo-shapes det er noe kult her, med ulike shapes, og at ting ikke følger helt alle regler, men det er fremdeles et konkret system.
- https://baselsupercluster.com her var det egentlig litt som eg likte, det er mange ulike former her, kule hover effekter på cards, header elementet

## Signatur-elementer

<!-- Hva skal gjore On Poynt gjenkjennelig? Velg 2-3 ting. Eksempler:
- En bestemt form (bolger, skrasnitt, klipp, organiske former)
- Illustrasjonsstil eller monster
- Uventet fargebruk (gradienter, duotone bilder)
- Bevegelse/animasjon som foeles unik
- Typografi-miks (display-font i headings)
-->

- Subtile bevegelser / animasjoner.
- Bestemte former, organiske former, sammen med en typegrafi miks.
- Lekene subtile bevegelser.

---

## Designretning — "Leken Profesjonalitet"

Basert på personlighet + inspirasjon. Dette er reglene vi designer etter.

### 1. Layout: Full-bredde med fargeseksjoner

- Seksjoner bruker **hele skjermbredden** — bakgrunnsfarger/gradienter strekker seg edge-to-edge
- Innhold har maks-bredde, men bakgrunner gjor det ikke
- Veksle mellom lyse og fargede seksjoner for visuell rytme
- Generost med whitespace — la ting puste

### 2. Former: Organisk formsprak

Signatur-elementet til On Poynt. Ikke bare runde hjorner — bruk et **system av former**:

- **Pill-shapes** — for tags, badges, knapper (full avrunding, ikke bare border-radius)
- **Organiske utklipp** — bilder som ikke er rektangulere (clip-path, blob-former)
- **Flytende elementer** — dekorative former/badges som overlapper grid-linjene
- **Ulike border-radius** — noen elementer har ekstra runde hjorner, andre har asymmetrisk avrunding
- Former skal foeles som et system: lekent men konsistent

### 3. Typografi: Miks med personlighet

Poppins til alt er for generisk. Vi trenger en **display-font** for headings:

- **Headings:** En display/serif-font med karakter (f.eks. bold, litt uventet)
- **Body:** Beholde Poppins eller lignende clean sans-serif
- **Storrelse-kontrast:** Store headings, liten body — dramatisk forskjell
- **Font-weight-spill:** Bruk tynne og tykke vekter i samme heading for variasjon

**Valgt display-font: Bricolage Grotesque**
- Varm, organisk sans-serif med personlighet
- CSS-variabel: `--font-bricolage`
- Tailwind-klasse: `font-heading`
- Vekter: 200-800 (bruk 700-800 for headings, 400-500 for subtitler)

### 4. Animasjoner: Subtilt og scroll-trigget

- **Scroll-reveal:** Elementer fader/glir inn nar de kommer i viewport (ikke bounce, bare smooth)
- **Parallax:** Forsiktig — bare pa dekorative elementer, ikke innhold
- **Hover:** Cards lofter seg, skygge oker, kanskje et lite fargeskift
- **Mikro-animasjoner:** Knapper som reagerer, ikoner som beveger seg subtilt
- **ALDRI:** Scroll-hijacking, overdrevne page-transitions, ting som hindrer vanlig scrolling

### 5. Farger: Rolig men levende

Beholde eksisterende palett, men bruke den **modigere**:

- **Fargede seksjoner:** Hele bakgrunner i primary/accent/muted — ikke bare hvitt
- **Pastellvarianter:** Lysere versjoner av primary/accent for bakgrunner
- **Subtle gradienter:** Myk overgang mellom to nere farger
- **Grid/tekstur-overlays:** Subtile monstre pa fargede bakgrunner (som Caide)
- Farger skaper **energi** uten a bli overveldende

### 6. Cards: Levende, ikke statiske

- **Tekstur-bakgrunn:** Subtle grid eller dot-pattern pa noen cards
- **Hover-effekt:** Loft + skygge + kanskje border-fargeskift
- **Variasjon:** Ikke alle cards trenger se like ut — miks storrelse og layout
- **Pill-tags:** Kategorier vises som pill-formede badges
- **Dekorative elementer:** Sma former eller ikoner som flyter rundt cards

### 7. Header: Integrert med innholdet

- Transparent header som flyter over hero-seksjonen
- Blir solid/blur ved scroll
- Navigasjon foeles som en del av siden, ikke et separat element
- Mobil-meny med personlighet (ikke bare en standard hamburgermeny-dropdown)

### 8. Footer: Mer enn bare lenker

- Eget design — ikke bare 4 kolonner med tekst
- Kan ha en CTA-seksjon, dekorative former, animasjon
- Full-bredde fargebakgrunn
- Samme formsprak som resten av siden

---

## Det vi har i dag

### Farger
- **Primary:** Teal/gronn (oklch 0.463 0.074 165)
- **Accent:** Varm coral/rosa (oklch 0.913 0.047 4.7)
- **Background:** Lys mint (oklch 0.979 0.008 197)
- **Foreground:** Mork gronn (oklch 0.2 0.072 161)

### Typografi
- **Headings:** Bricolage Grotesque (varm, organisk sans-serif) — `font-heading`
- **Body:** Poppins (clean sans-serif) — `font-sans`
- **Heading 1:** 3.4rem desktop / 1.75rem mobil
- **Heading 2:** 2.2rem desktop / 1.5rem mobil
- **Body:** 1rem

### Form
- **Border radius:** 0.625rem (--radius)
- **Stil:** Runde hjorner, standard card/shadow

---

## Implementasjonsguide — hvor ting endres

Denne seksjonen er referansen slik at vi alltid vet **hvilke filer** som pavirker **hva**.

### Fonter
- **Laste inn fonter:** `apps/web/app/(frontend)/layout.tsx` — next/font imports + CSS-variabler
- **Koble font til heading/body:** `tooling/tailwind/web.css` — `--font-heading`, `--font-sans`
- **Heading-komponent:** `packages/ui/components/typography.tsx` — bruker `font-heading` klasse
- **Status:** Bricolage Grotesque (`--font-bricolage`) er heading-font, Poppins (`--font-poppins`) er body-font

### Farger og tema
- **CSS-variabler:** `tooling/tailwind/web.css` — alle OKLCH-farger definert her
- **Nye fargevarianter:** Legg til i `:root {}` blokken i web.css
- **Bruk i komponenter:** Via Tailwind-klasser (`bg-primary`, `text-accent`, osv.)

### Typografi-storrelser
- **Definert i:** `tooling/tailwind/web.css` under `@theme inline {}` blokken
- **Brukt via:** `packages/ui/components/typography.tsx` (Heading/Text-komponentene)
- **Responsivt:** Mobile-forst, desktop via `md:` breakpoint

### Layout / Container
- **Container-komponent:** `packages/ui/components/container.tsx`
- **Varianter:** sm (max-w-3xl), default (max-w-6xl), lg (max-w-7xl), full
- **Padding:** none, sm, default, lg, xl
- **Full-bredde bakgrunn:** Wrapper utenfor Container med bakgrunnsfarge, Container inni for innhold

### Blokker (seksjonene pa sidene)
- **Blokk-definisjoner (Payload schema):** `apps/web/blocks/*.ts`
- **Blokk-rendering (React):** `apps/web/components/blocks/*-block.tsx`
- **Hero:** `hero-block.tsx` — 5 varianter (centered, left, split, fullscreen, gradient)
- **CTA:** `cta-section-block.tsx` — 3 varianter (simple, colored, image)
- **Registrering:** Nye blokker ma legges til i `payload.config.ts`

### Header
- **Komponent:** `apps/web/components/header.tsx`
- **Data:** Kommer fra Payload Global "header" (konfigurert i admin)
- **Layout-kobling:** `apps/web/app/(frontend)/layout.tsx`

### Footer
- **Komponent:** `apps/web/components/footer.tsx`
- **Data:** Kommer fra Payload Global "footer" + "site-settings"
- **Layout-kobling:** `apps/web/app/(frontend)/layout.tsx`

### Cards
- **Base-komponent:** `packages/ui/components/card.tsx`
- **Brukt i:** Blogg-arkiv, produkt-arkiv, tjeneste-arkiv, diverse blokker
- **Endringer her pavirker:** Alle cards overalt pa siden

### Knapper
- **Komponent:** `packages/ui/components/button.tsx`
- **Varianter:** default, destructive, outline, secondary, ghost, link
- **Storrelser:** default, sm, lg, icon

### Badges
- **Komponent:** `packages/ui/components/badge.tsx`
- **Varianter:** default, secondary, muted, accent, destructive, outline
- **Storrelser:** sm, default, lg

### Animasjoner
- **Keyframes:** `tooling/tailwind/web.css` (float-slow, float-medium, float-fast, blob)
- **Scroll-animasjoner:** Ma legges til (f.eks. Framer Motion eller CSS Intersection Observer)
- **Hover-effekter:** Direkte pa komponentene via Tailwind (`hover:`, `group-hover:`)

---

## Komponenter — redesign-plan

<!-- Kryss av etter hvert som vi redesigner -->

- [ ] Velg display-font for headings
- [ ] Header / Navigasjon (transparent, integrert med hero)
- [ ] Hero-seksjon (full-bredde, former, animasjon)
- [ ] Cards (tekstur, hover, pill-tags, variasjon)
- [ ] CTA-blokker (former, fargede bakgrunner)
- [ ] Footer (redesign, animasjon, former)
- [ ] Knapper og interaktive elementer (pill-form, hover)
- [ ] Seksjonsrytme (fargede bakgrunner + global korn-tekstur)
- [ ] Scroll-animasjoner (reveal, parallax pa dekor)
