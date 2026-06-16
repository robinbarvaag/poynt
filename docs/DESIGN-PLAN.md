# Design-plan — «Reisen» og bevegelse

Komplement til [DESIGN.md](DESIGN.md). Der definerer vi *reglene*; her definerer vi
**signaturen**, **scroll-reisen** og **hvordan vi bygger bevegelsen** — konkret nok til å
implementere, forankret i tokens og komponenter vi allerede har.

Premiss fra inspirasjonen (Reasonal, Caide, Lemon Squeezy, Basel, INSPO-bildene):
bruk **hele skjermen**, **rolige farger som skaper liv**, og **subtile bevegelser** —
aldri scroll-hijacking, aldri overkill. Det skal føles «helt vanlig scroll», men med
små ting som gjør at det lever.

---

## 1. Signaturen — «Det levende systemet»

Én sammenbindende idé som gjør On Poynt gjenkjennelig. Tre lag som alltid spiller sammen:

1. **Redaksjonell tekstur + asymmetri** — en fin korn-/papirtekstur (`Grain`) over
   hele siden, og litt asymmetriske layouts (av-senter, ujevne kolonneforhold). Dette
   er signaturen, ikke formede seksjons-overganger (dem bruker vi ikke — se
   docs/COMPOSITION.md §3). Myke drivende blobs er fortsatt med, men kun som bakgrunn
   på hero/CTA.
2. **Én delt bevegelsesgrammatikk** — *alt* som animerer bruker samme varighet, easing og
   avstand. Det er dette som skiller «designet subtilitet» fra «tilfeldige animasjoner».
   Definert som motion-tokens (§3), brukt overalt.
3. **«Alt puster»** — dekorative former driver sakte hele tiden (vi har allerede
   `float-*` og `blob` keyframes). Lavmælt liv, ikke en lysshow.

Den røde tråden gjennom siden er en **drivende form** — en stor, myk blob som skifter
farge og posisjon fra seksjon til seksjon mens du scroller. Den binder «reisen» sammen
uten å være påtrengende.

---

## 2. Scroll-reisen — forsiden seksjon for seksjon

Tenk forsiden som en fortelling med rytme mellom lyse og fargede full-bredde-seksjoner.
Hver seksjon har én jobb og ett bevegelsesgrep.

| # | Seksjon | Jobb | Bevegelse (subtil) |
|---|---------|------|--------------------|
| 1 | **Hero** | Slå an tonen | Flytende former (parallax-drift), heading med vekt-spill, blob bak |
| 2 | **Verdi / problem** | «Dette løser vi» | Farget full-bredde-seksjon, scroll-reveal av punkter med stagger |
| 3 | **Slik funker det** | 3 steg | Modige fargede kort (gul/coral/mint, jf. PayPal-INSPO) med strek-ikon, hover-løft |
| 4 | **Bevis / tall** | Tillit | Count-up på tall (99+, 10k+) når de kommer i viewport |
| 5 | **Medlemskap / portal** | Konvertering | Pricing-kort med grid-tekstur (jf. Caide), pill-tags, hover |
| 6 | **CTA + footer** | Siste dytt | Egen-designet footer, organisk form, myk reveal av CTA |

Den drivende blob-formen (§1) skifter farge gjennom disse: teal → coral → mint → teal.

---

## 3. Motion-tokens — bevegelsesgrammatikken

Legg disse i `tooling/tailwind/web.css` (`@theme inline`) og i en delt motion-config, så
all bevegelse er konsistent. Forslag (kalibrert for «subtilt»):

```
--ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);   /* smooth, ingen bounce */
--dur-fast: 0.2s;     /* hover, mikro */
--dur-base: 0.5s;     /* scroll-reveal */
--dur-slow: 0.8s;     /* store seksjons-reveals */
--reveal-rise: 16px;  /* hvor langt et element glir inn */
```

Regler:
- **Reveal:** fade `0 → 1` + glid `16px → 0`. Varighet `--dur-base`, easing `--ease-out-soft`.
  Trigges **én gang** når elementet er ~20 % i viewport. Aldri på vei ut.
- **Stagger:** barn forskyves `60–80ms`. Maks ~6 elementer før det føles tregt.
- **Hover (kort):** løft `translateY(-4px)` + økt skygge + ev. border-fargeskift. `--dur-fast`.
- **Parallax:** kun dekor (blobs/former), aldri tekst/innhold. Maks ~8–12 % forskyvning.
- **`prefers-reduced-motion`:** slå av glid/parallax, behold opacity. Ikke valgfritt.

---

## 4. Form-tokens — det organiske systemet

Et lite, bevisst sett — ikke uendelig variasjon:

- **Pill:** `rounded-full` — tags, badges, knapper, søkefelt (jf. header-INSPO).
- **Soft:** `--radius` (0.625rem) — standard kort/inputs.
- **Blob:** 2–3 forhåndsdefinerte `border-radius`-«blober» (asymmetriske, f.eks.
  `60% 40% 55% 45% / 50% 60% 40% 50%`) — dekor og bilde-utklipp via `clip-path`/maske.
- **Grid/dot-tekstur:** subtilt overlay på utvalgte fargede kort (jf. Caide). Lav opacity.

Mål: når man ser to On Poynt-sider skal formspråket føles som samme «hånd».

---

## 5. Teknisk fundament

Vi har allerede **`framer-motion` (v12)** i `apps/web` og `packages/ui` — ikke noe nytt å
installere. Bygg et lite, gjenbrukbart sett primitives så animasjon blir lett og konsistent:

- `Reveal` — wrapper som gjør fade+rise via `whileInView` (bruker motion-tokens).
- `Stagger` / `StaggerItem` — for lister og kort-rader.
- `Parallax` — `useScroll` + `useTransform` for dekor-drift.
- `CountUp` — animerer tall i viewport.
- `DriftingBlob` — den seksjons-bindende formen som skifter farge.

Forslag: legg dem i `packages/ui/components/motion/` og eksporter via barrel, så de også
dukker opp i **Storybook** (vi kan lage en `Foundations/Bevegelse`-story som demonstrerer
hver primitive — da ser vi grammatikken samlet ett sted).

Ytelse/UU: animer kun `transform`/`opacity`, respekter `prefers-reduced-motion`, og hold
parallax til `will-change: transform` på få elementer.

---

## 6. Faseplan

Bygg nedenfra: tokens → primitives → seksjoner. Da blir alt konsistent fra start.

- **Fase 0 — Fundament**
  - [ ] Motion-tokens i `web.css` (§3) + blob-form-tokens (§4)
  - [ ] Motion-primitives i `packages/ui/components/motion/` (§5)
  - [ ] `Foundations/Bevegelse`-story i Storybook
- **Fase 1 — Hero + header**
  - [ ] Transparent header → blur ved scroll (`apps/web/components/header.tsx`)
  - [ ] Hero med drivende blob + parallax-dekor (`hero-block.tsx`)
- **Fase 2 — Kort + seksjoner**
  - [ ] Kort: hover-løft, grid-tekstur-variant, pill-tags (`packages/ui/components/card.tsx`)
  - [ ] «Slik funker det»-kort i modige farger (PayPal-INSPO)
  - [ ] Scroll-reveal + stagger på arkiv-/feature-seksjoner
- **Fase 3 — Bevis + konvertering**
  - [ ] CountUp på tall-seksjon
  - [ ] Pricing/medlemskap-kort med tekstur
- **Fase 4 — Footer + polish**
  - [ ] Footer-redesign med form + CTA + myk animasjon
  - [ ] Fargerytme + korn-tekstur ende-til-ende
  - [ ] Reduced-motion-gjennomgang på hele forsiden

---

## 7. Vokterregler (så det ikke blir overkill)

- Maks **ett** primært bevegelsesgrep per seksjon.
- Ingen animasjon som forsinker lesing eller blokkerer scroll.
- Parallax kun på dekor, aldri på tekst.
- Samme easing/varighet overalt (motion-tokens) — variasjon kommer fra *innhold*, ikke fra
  tilfeldige animasjonsverdier.
- Hvis du er i tvil om noe er for mye: det er for mye.
