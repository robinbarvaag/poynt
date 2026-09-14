# Eventer: påmelding, billetter og innsjekk

> **Status:** fase 1 er bygget og verifisert lokalt (2026-09-14). Gjenstår før lansering: innhold i
> lanseringsfesten, oppdatert personvernside, og en ekte test med e-post og mobilskanning.
> Dette dokumentet er kilden til sannhet for beslutninger, datamodell og faser.
> Oppdater sjekklista (§ 9) og beslutningsloggen (§ 10) etter hvert som vi bygger.

## 1. Hva og hvorfor

Poynt skal kunne arrangere eventer selv i stedet for å gå via et eksternt billettsystem
(Susanne har tidligere brukt LeanTicket). Det første eventet er **lanseringsfesten for
boka «Verdifull vekst»** (foreløpig dato: **15. oktober 2026**, ikke bekreftet). Det er
gratis, men modellen skal tåle betalte eventer senere.

Kort fortalt:

- En egen type **«Eventer»** i admin, med samme redaksjonelle mønster som Sider og
  Tjenester (faner, kvalitetssjekk, veiledning, SEO).
- En offentlig eventside på `/eventer/[slug]` med lekne komponenter og påmelding.
- Hver påmeldt får en **personlig kode + QR-kode** på e-post og en **personlig
  billettside** der de kan se status og melde seg av.
- Nyhetsbrev-avkrysning ved påmelding, som logges med kilde «Event-påmelding» og eventets navn.
- **Kapasitet og venteliste** allerede fra første versjon.
- En **innsjekk-side** i admin der Robin/Susanne skanner QR-koder i døra.

## 2. Beslutninger så langt

| Tema | Beslutning |
|---|---|
| Navn og adresse | «Eventer», `/eventer` og `/eventer/[slug]` |
| Kapasitet | Valgfritt maks antall per event |
| Venteliste | Valgfri per event; automatisk opprykk ved avmelding |
| Følge («ta med noen») | **Ikke i fase 1.** Hver person melder seg på selv og får sin egen kode. Se § 10 |
| Billettside | Ja, uten innlogging: hemmelig lenke `/eventer/billett/<token>` |
| Avmelding | Knapp på billettsiden + «Er du sikker?». Ingen e-postbekreftelse (lenken er beviset), men kvittering på e-post etterpå |
| Påmeldingsskjema | Faste felt (navn, e-post) + enkel liste med ekstra spørsmål per event. **Ikke** form-builder-pluginen |
| Lagring av påmeldinger | Egen Payload-collection `event-registrations` (ikke `form-submissions`) |
| Eventinnhold | RichText («Om eventet», «Praktisk info») + programliste + FAQ. **Ikke** sideblokker (se § 10) |
| Eksternt billettsystem | Eventet kan ha en ekstern påmeldingslenke som alternativ (f.eks. LeanTicket) |
| Betaling | Fase 3. Statusene reserveres i datamodellen fra start |

## 3. Datamodell (Payload, `public`-schema)

Påmeldte er ikke innlogget, og alt skal administreres i Payload admin. Derfor ligger alt
i Payload, på samme måte som `form-submissions` og `newsletter-consents`, og ikke i
Better Auth/Drizzle. Migrasjon: `20260914_181616_events`.

### 3.1 `events` (`collections/events.ts`)

Admin-gruppe: **Innhold**. Etiketter: «Event» / «Eventer». Drafts med autosave.

Faner (tabs-feltet **først** i `fields`, så seoPlugin kan legge til «SEO»-fanen):

- **Innhold:** `title`, `excerpt`, `heroImage`, `startsAt`/`endsAt`, `doorsOpenAt`,
  `location` (`name`, `mapUrl`, `address`, `online`), `description` (richText),
  `program` (array: `time`, `title`, `description`), `practicalInfo` (richText), `faq`
- **Påmelding:** `registrationMode` (`internal` | `external` | `none`), `externalUrl`/`externalLabel`,
  `capacity`, `waitlistEnabled`, `registrationOpensAt`/`registrationClosesAt`, `ticketsEnabled`,
  `newsletterOptIn`, `extraQuestions` (array: `label`, `type`, `options`, `required`, `name` auto),
  `confirmationMessage`
- **Påmeldte:** UI-komponent (§ 6.1)
- **Hjelp og kvalitet:** ContentGuidelines + Eventsjekk (TextCheck) + «Vurder kvalitet»
- **SEO:** fra seoPlugin

Sidebar: `slug`, `eventStatus` (`scheduled` | `postponed` | `cancelled`), Kvalitet.

Hooks: slug fra tittel; `extraQuestions[].name` settes én gang fra spørsmålsteksten (så en
omformulering ikke kobler fra gamle svar); `beforeDelete` sletter påmeldingene til eventet.

Pris-felt (`priceKr`, `stripe…`) legges til i fase 3.

### 3.2 `event-registrations` (`collections/event-registrations.ts`)

Skjult fra menyen (`group: false`); brukes via «Påmeldte»-fanen og innsjekk-siden.
`create` er stengt for API-et — kun serveren oppretter (local API).

| felt | type | notat |
|---|---|---|
| `event` | relationship → events | påkrevd, indeksert |
| `name`, `email` | text / email | e-post lagres i små bokstaver |
| `status` | select | `registered` · `waitlisted` · `checked_in` · `cancelled` |
| `code` | text, unik | `POY-XXXX` fra alfabet uten 0/O/1/I |
| `token` | text, unik | 32 bytes base64url; feltadgang `read: false` (aldri ut via API/admin) |
| `answers` | json | svar på `extraQuestions`, nøkkel = `name`; ukjente felt forkastes |
| `newsletter` | checkbox | |
| `waitlistPosition` | number | satt mens `waitlisted` |
| `checkedInAt` / `checkedInBy` | date / → users | |
| `cancelledAt` / `cancelledBy` | date / `self` · `admin` | |
| `promotedAt` | date | |
| *(fase 2)* `reminderSentAt` | date | ikke lagt til ennå |
| *(fase 3)* `pending_payment`/`refunded` + Stripe-felt | | ikke lagt til ennå |

**QR-koden inneholder** billettlenken (`/eventer/billett/<token>`). Et vanlig mobilkamera
åpner billettsiden; skanneren trekker ut nøkkelen. Koden er reserve for manuell innsjekk.

## 4. Flyter (kode i `lib/events/`)

- `registrations.ts` — all skriving. Alt som teller plasser kjører i en transaksjon med
  `pg_advisory_xact_lock(7401, eventId)`. **Sender ingen e-post.**
- `notify.ts` — e-post, internvarsel og nyhetsbrev, kalt av API-rutene etter commit. Feil svelges.
- `public.ts` — cachede lesere for de offentlige sidene (plass-teller tagget `event-<id>`).
- `capacity.ts`, `codes.ts`, `format.ts`, `ics.ts` — ren logikk med tester (`events.test.ts`).

### 4.1 Påmelding — `POST /api/eventer/[id]/pamelding`
Rate limit (8 / 10 min), honningkrukke-felt `website`. Sjekker publisert, modus, status,
påmeldingsvindu, navn/e-post og påkrevde svar. I låsen: eksisterende aktiv påmelding →
billett sendes på nytt (**uten** å returnere billettlenken, så ingen kan hente andres billett);
ellers plass → `registered`, fullt + venteliste → `waitlisted`, fullt → 409. Etter svaret
(`after()`): internvarsel + nyhetsbrev.

### 4.2 Avmelding (selvbetjent) — `POST /api/eventer/billett/[token]/avmelding`
Nekter hvis allerede sjekket inn. Status → `cancelled`; tok den plass, rykker første på
ventelista opp (hvis det fortsatt er plass). Kvittering, opprykks-billett og internvarsel etter svaret.

### 4.3 Admin-handlinger — `POST /api/eventer/admin/pamelding/[id]`
`cancel` (valgfri e-post), `promote` (også når fullt), `check-in`, `undo-check-in`, `resend`.

### 4.4 Innsjekk — `POST /api/eventer/admin/innsjekk`
Tar skannet verdi eller kode → `ok` · `already` · `waitlisted` · `cancelled` · `unknown` ·
`wrong_event`, pluss tellere. `force` slipper inn venteliste/avmeldt («Slipp inn likevel»).

### 4.5 Andre ruter
`GET /api/eventer/[id]/kalender` (.ics), `GET /api/eventer/admin/[id]` (oversikt),
`GET /api/eventer/admin/[id]/csv` (semikolon + BOM for norsk Excel).
NB: rutene ligger under `/api/eventer/…` fordi `/api/events/…` er Payloads REST-API.

### 4.6 Sletting og anonymisering (personvern)
Frister i `lib/events/retention.ts` (ren logikk, testet i `retention.test.ts`), jobb i
`lib/events/retention-job.ts`, kjørt av Inngest-funksjonen `event-retention`
(`lib/inngest/functions/event-retention.ts`) **hver natt kl. 03:15 norsk tid**:
- **14 dager** etter at eventet er ferdig (sluttid, ellers starttid): `answers` tømmes.
- **6 måneder** etter: navn, e-post, kode og billettnøkkel byttes ut (`Slettet`,
  `pamelding-<id>@slettet.invalid`, `SLETTET-<id>`, ny nøkkel), `answers`/`newsletter`/`checkedInBy`
  nullstilles. Radene blir stående, så tellerne i «Påmeldte» beholdes uten personopplysninger.
  Gammel billettlenke slutter å virke.
- Jobben tåler å kjøres flere ganger (hopper over det som er ryddet) og logger bare antall.
  Manuell kjøring: send `events/retention.requested` (med `{ "dryRun": true }` for å se hva som ville
  blitt ryddet) fra Inngest-dashbordet.
- «Slett» i «Påmeldte»-fanen fjerner én påmelding helt (når noen ber om det). Er eventet ikke startet
  og personen hadde plass, meldes den av først, så ventelista rykker opp.
- Internvarselet på e-post inneholder ikke lenger svarene på ekstra spørsmål, bare at det finnes svar.

## 5. Frontend

- `/eventer` — kommende (cachet, fornyes hver time) + tidligere eventer.
- `/eventer/[slug]` — statisk (`'use cache'` + `cms`), plass-teller cachet separat.
  Alt som avhenger av «nå» (påmeldingsvindu) regnes ut i nettleseren. `EventView` deles
  med `/forhandsvisning/eventer/[slug]`.
- `/eventer/billett/[token]` — dynamisk, `instant = false`, `noindex`, blokkert i robots.txt.
  `LiveTicket` spør `GET /api/eventer/billett/[token]/status` hvert 5. sekund (bare mens siden er
  synlig, fra 48 t før til 6 t etter eventet). Blir personen skannet mens siden står åpen, **rives
  billettstumpen av** langs perforeringen (framer-motion + animert `clip-path`), et «Sjekket inn»-stempel
  og konfetti dukker opp, og siden hentes på nytt. Revet billett er også slutt-tilstanden ved ny
  innlasting. Respekterer `prefers-reduced-motion`.

**Komponenter i `@poynt/ui`** (`components/event/`, story: `Blokker/Eventer`):
`EventTicket`, `SpotsMeter`, `EventProgram`, `EventFacts`, `EventDateBadge`, `ConfettiBurst`.
Nedtelling gjenbruker `Countdown`. I `apps/web`: `RegistrationForm`, `CancelRegistration`, `EventCard`.

**SEO/GEO:** `eventSchema` (Event, status, sted, gratis-tilbud), brødsmuler, FAQ; sitemap;
markdown via `/eventer/<slug>.md` og seksjon «Eventer» i `llms.txt`.

**MCP:** på sikt `create_event_draft` i `lib/mcp/`. Ikke i fase 1.

## 6. Admin

### 6.1 Fanen «Påmeldte» (`admin/components/events/registrations-panel.tsx`)
Tellere, søk, statusfilter, tabell med svar på ekstra spørsmål, handlinger per rad,
lenker til innsjekk og CSV.

### 6.2 Innsjekk (`/innsjekk`, lenke under Drift og i «Påmeldte»-fanen)
Egen mobilside utenfor Payload-rammen (`app/(innsjekk)/`, egen rot-layout, noindex, blokkert i
robots.txt). Krever innlogget Payload-bruker; ellers videresending til
`/admin/login?redirect=/innsjekk`. Komponent: `components/events/check-in-scanner.tsx`.

Laget for kø i døra, én billett om gangen:
- Tellerkort øverst: «X av Y har kommet» + fremdriftslinje, hentes på nytt hvert 20. sekund
  (flere i døra ser det samme).
- Kamera (BarcodeDetector der den finnes, ellers `jsqr`). Hvert treff gir et **fullflate farget
  kort oppå kameraet** (ikon, status, navn, kode), lydsignal (kan slås av, huskes lokalt) og
  vibrasjon. Skanningen pauses mens kortet vises; det forsvinner av seg selv (ok 2,2 s, feil 3,5–4 s)
  eller med «Skann neste». Samme QR ignoreres i 8 s.
- Venteliste/avmeldt: kortet blir stående til man velger «Slipp inn likevel» eller «Ikke slipp inn».
- «Siste skanninger»-logg (30 siste) med «Angre» på innsjekkinger.
- Skjermen holdes våken (Wake Lock) mens kameraet er på. Manuelt kodefelt som reserve.
- Innsjekk oppdaterer påmeldingen (`checked_in` + tidspunkt + hvem), synlig i «Påmeldte»-fanen.
  Folk uten påmelding kan ikke sjekkes inn herfra (se § 10).

### 6.3 Kvalitetssjekk
`EVENT_DIMENSIONS` i `/api/ai/quality-review`, serialisering i `lib/events/serialize-event.ts`,
`events` i `QUALITY_COLLECTIONS` (vises i Kvalitetsoversikten), ContentGuidelines og
Eventsjekk (sluttid, sted, frist etter start, kapasitet uten venteliste, ekstern lenke mangler, avlyst).

## 7. E-poster (`@poynt/email`, med i `/admin/epost`-forhåndsvisning, gruppe «Eventer»)

| Mal | Når | Innhold |
|---|---|---|
| `event-ticket` | påmeldt / rykket opp / sendt på nytt | kode, QR (innebygd PNG via `contentId`), billettlenke, tid/sted, egen hilsen, praktisk info, `.ics`-vedlegg |
| `event-waitlisted` | venteliste | plassnummer, lenke for å melde seg av |
| `event-cancelled` | avmeldt | kvittering (egen tekst når admin meldte av) |
| internvarsel | ny påmelding / venteliste / avmelding | via `contact-notification`-malen, til varslingsadressene |

## 8. Personvern

- **Ikke kjør `scripts/seed-personvern.ts`.** Susanne har redigert innholdet på nettsiden manuelt,
  og scriptet overskriver hele /personvern. Det gjelder alle seed-scripts som oppdaterer noe som
  finnes fra før. Seed brukes bare til helt nytt innhold (create-only, som `seed-launch-event.ts`).
- Teksten om eventer legges inn **i admin** (Sider → Personvern) når slettejobben finnes. Forslag:
  - Under behandlingsgrunnlag: «Eventer: Når du melder deg på et event, lagrer vi navn,
    e-postadresse, eventuelle svar du gir i påmeldingen (for eksempel allergier), om du er sjekket
    inn, og når du meldte deg på eller av. Vi bruker opplysningene til å holde av plassen din, sende
    billett og praktisk informasjon, sjekke deg inn og gi deg plass fra ventelista (art. 6 nr. 1 b).
    Svar om allergier eller andre hensyn brukes bare til å tilrettelegge eventet. E-posten brukes
    bare til nyhetsbrev dersom du krysser av for det.»
  - Under lagringstid (§ 5): «Påmeldinger til eventer: svar på spørsmål i påmeldingen (for eksempel
    allergier) slettes to uker etter eventet. Navn og e-postadresse slettes seks måneder etter eventet.
    Vi beholder bare antall påmeldte og hvor mange som kom, uten opplysninger om hvem.»
  - § 2 må justeres: den sier i dag «Vi ber deg aldri oppgi sensitive personopplysninger», men
    påmeldingen kan spørre om allergier (helseopplysninger, særlig kategori). Forslag: «Ved påmelding
    til eventer kan vi spørre om allergier eller andre hensyn. Det er frivillig, brukes bare til å
    tilrettelegge eventet, og slettes to uker etter.» Grunnlag for helseopplysningene er ditt
    uttrykkelige samtykke (art. 9 nr. 2 a), som du gir ved å fylle ut feltet.
  - Lista over formål og behandlingsgrunnlag (§ 3) får «Eventer»-avsnittet over som eget punkt.
- Status for automatisk sletting: **bygget** (§ 4.6), aktiv når koden er deployet og Inngest har
  synkronisert funksjonene. Teksten kan publiseres etter det.
- Tokens er hemmelige og skal ikke logges.

## 9. Faser og sjekkliste

### Fase 1: Lanseringsfesten (mål: klar i god tid før 15. oktober)
- [x] `events`-collection med faner, drafts, seoPlugin, redirects-registrering
- [x] `event-registrations`-collection
- [x] Payload-migrasjon (`20260914_181616_events`, kjørt lokalt)
- [x] `lib/events/`: kodegenerator, token, kapasitet/venteliste-logikk (med tester)
- [x] Påmeldings-API med transaksjon, rate limit og honningkrukke
- [x] Nyhetsbrev-kilde `event` + samtykketekst
- [x] E-poster: billett (QR + .ics), venteliste, avmelding, internvarsel
- [x] Frontend `/eventer`, `/eventer/[slug]`, `/eventer/billett/[token]`
- [x] UI-komponenter: plassmåler, program, faktakort, datomerke, billett, konfetti (+ story)
- [x] Event-JSON-LD, sitemap, robots, markdown/llms.txt, forhåndsvisning
- [x] Avmelding + automatisk opprykk fra venteliste
- [x] Admin-fanen «Påmeldte» (+ CSV, som var planlagt i fase 2)
- [x] `/admin/innsjekk` med skanner
- [x] Kvalitetssjekk: `EVENT_DIMENSIONS`, regelsjekker, veiledning
- [x] Seed-script for lanseringsfesten (`seed-launch-event.ts`, kjørt: utkast opprettet)
- [ ] Fyll inn lanseringsfesten i admin (sted, plasser, program, praktisk info, bilde) og publiser
- [ ] Personvern: bestem slettefrist, legg inn teksten fra § 8 **i admin** (ikke kjør seed-scriptet)
- [ ] Legg «Eventer» inn i navigasjonen (Navigasjon-global i admin)
- [x] Ekte test, del 1 (2026-09-14, via tunnel + iPhone): påmelding med ekte e-post → billett levert
      (Resend: delivered, havnet i Reklame), internvarsel, skanning med mobil på `/innsjekk` → sjekket inn
- [ ] Ekte test, del 2: venteliste-påmelding → avmelding → opprykk-e-post; åpne `.ics` i kalender;
      QR i Outlook/iPhone Mail; skanning på Android
- [x] Innsjekk flyttet ut av Payload til `/innsjekk` (egen mobilside, admin-innlogging)
- [x] Tydelig skanne-feedback: fullflate farget kort oppå kameraet, lyd, vibrasjon, logg med «Angre»
- [x] Billettsiden river av billetten live når personen skannes (+ mer kompakt billett på mobil)
- [x] Visuell gjennomgang av eventsiden og `/eventer` (mobil + desktop): program-tider, nedtelling,
      dobbel dato og tomt bildefelt rettet
- [ ] Se over «Påmeldte»-fanen visuelt i admin (ikke skjermtestet)
- [ ] Nyhetsbrev-sjekk (allerede abonnent → ingen ny påmelding/varsel) og nye varseltekster: verifiser
      ved neste ekte påmelding
- [ ] Vurder «Registrer på stedet» i innsjekk for folk uten påmelding (ikke bestemt)
- [ ] DNS (e-post): DMARC + SPF lagt inn 2026-09-14. Google Workspace-DKIM utsatt (ikke kritisk med
      `p=none`); gjør det før DMARC strammes inn

Verifisert 2026-09-14 mot lokal database: 5 samtidige påmeldinger til 2 plasser ga 2 påmeldt +
3 venteliste; duplikat gjenkjent; påkrevde svar håndhevet; opprykk ved avmelding; alle
innsjekk-utfall; sletting av event fjerner påmeldinger. Sidene, .ics, markdown og 401 på
admin-API testet mot dev-server. E-postmalene rendret (ikke sendt).

### Fase 2
- [ ] Påminnelse 24 t før (Inngest) + `reminderSentAt`
- [x] CSV-eksport
- [ ] «Ta med følge» (valgfritt per event, se § 10)
- [x] Automatisk sletting/anonymisering etter eventet (Inngest-cron, § 4.6) — bygget 2026-09-14,
      prøvekjørt med `dryRun`; aktiveres ved deploy
- [x] «Slett»-knapp i «Påmeldte» for sletteforespørsler
- [ ] MCP-verktøy `create_event_draft`
- [ ] E-post til alle påmeldte fra admin (endringer, avlysning)

### Fase 3: Betalte eventer
- [ ] Pris på event; Stripe Checkout med `price_data` (kr × 100), gjenbruk av checkout-mønsteret
- [ ] `pending_payment` → `registered` via webhook; utløpte økter frigjør plassen
- [ ] Refusjon fra fanen Påmeldte (Stripe refund) → `refunded`
- [ ] Rabattkoder (Stripe Promotion Codes, som i nettbutikken)
- [ ] Kvittering

## 10. Åpne spørsmål og beslutningslogg

| Dato | Tema | Status |
|---|---|---|
| 2026-09-14 | Dato for lanseringsfesten | Foreløpig 15. oktober, ikke bekreftet |
| 2026-09-14 | Følge / plus-one | Utsatt til fase 2. Hvis det kommer: valgfritt per event, maks N følgere, hver følger får sin egen kode (sendes til den som meldte på, e-post til følger valgfri) |
| 2026-09-14 | Eksternt billettsystem | Ingen integrasjon. Susanne har brukt LeanTicket; eventet kan lenke ut dit ved behov. Import av gamle deltakerlister til nyhetsbrev krever eget samtykke og gjøres ikke automatisk |
| 2026-09-14 | Skannerbibliotek | `jsqr` (ren JS, ingen worker — trygt med Turbopack), med nettleserens BarcodeDetector når den finnes |
| 2026-09-14 | Innhold som blokker vs. richText | RichText + program + FAQ. Blokker ga mer å vedlikeholde (render, markdown, kvalitet) for lite gevinst på én eventside. Kan legges til senere som eget `layout`-felt |
| 2026-09-14 | Billettlenke ved duplikat | Returneres ikke fra API-et når e-posten allerede var påmeldt — billetten sendes på nytt til e-posten i stedet |
| 2026-09-14 | Sletting av event | `beforeDelete`-hook sletter påmeldingene (FK er `set null` på en påkrevd kolonne) |
| 2026-09-14 | Slettefrist for påmeldinger | Foreslått seks måneder i personvernteksten — må bekreftes, og automatisk sletting må bygges før teksten publiseres |
| 2026-09-14 | Innsjekk i admin vs. egen side | Flyttet fra `/admin/innsjekk` (Payload-view) til egen side `/innsjekk` med admin-innlogging. Payload-rammen (meny, topplinje) var rotete på mobil i døra |
| 2026-09-14 | Nyhetsbrev: allerede abonnent | `subscribeToNewsletter` slår opp kontakten i Resend først; aktiv abonnent → samtykket logges, men ingen ny påmelding og intet «Ny på nyhetsbrevet»-varsel (gjelder alle kilder) |
| 2026-09-14 | Sletting: to trinn | Svar på ekstra spørsmål (kan være helseopplysninger) slettes 14 dager etter eventet; navn/e-post anonymiseres etter 6 måneder i stedet for at radene slettes, så statistikken beholdes uten migrasjon eller endring av eventet. Svar sendes ikke lenger i internvarsel-e-posten |
| 2026-09-14 | Internvarsel for eventer | Brukte kontaktskjema-malen med «Noen vil i kontakt». Malen tar nå `eyebrow`/`heading`/`intro`/`messageLabel`; eventer og bok-ventelista har egne tekster |
