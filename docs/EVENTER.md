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

## 5. Frontend

- `/eventer` — kommende (cachet, fornyes hver time) + tidligere eventer.
- `/eventer/[slug]` — statisk (`'use cache'` + `cms`), plass-teller cachet separat.
  Alt som avhenger av «nå» (påmeldingsvindu) regnes ut i nettleseren. `EventView` deles
  med `/forhandsvisning/eventer/[slug]`.
- `/eventer/billett/[token]` — dynamisk, `instant = false`, `noindex`, blokkert i robots.txt.

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

### 6.2 Innsjekk (`/admin/innsjekk`, lenke under Drift)
Velg event (dagens først, eller `?event=`), kamera-skanner (BarcodeDetector der den finnes,
ellers `jsqr`), store fargede resultatkort, vibrasjon, manuelt kodefelt, «X av Y har kommet».

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

- `scripts/seed-personvern.ts` har fått et avsnitt om eventer og en slettefrist (seks måneder
  etter eventet). **Seed-scriptet er ikke kjørt** — det overskriver /personvern i databasen.
- **Løftet om sletting er ikke automatisert ennå** (fase 2). Til da: slett påmeldingene manuelt,
  eller utsett publisering av personvernteksten til jobben finnes.
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
- [ ] Personvern: bestem slettefrist, kjør `seed-personvern.ts` (eller rediger siden i admin)
- [ ] Legg «Eventer» inn i navigasjonen (Navigasjon-global i admin)
- [ ] Ekte test: meld på med egen e-post → sjekk billett-e-post (QR vises?) → skann med mobil i
      `/admin/innsjekk` → meld av → opprykk-e-post
- [ ] Se over «Påmeldte»-fanen og innsjekk-siden visuelt i admin (ikke skjermtestet)

Verifisert 2026-09-14 mot lokal database: 5 samtidige påmeldinger til 2 plasser ga 2 påmeldt +
3 venteliste; duplikat gjenkjent; påkrevde svar håndhevet; opprykk ved avmelding; alle
innsjekk-utfall; sletting av event fjerner påmeldinger. Sidene, .ics, markdown og 401 på
admin-API testet mot dev-server. E-postmalene rendret (ikke sendt).

### Fase 2
- [ ] Påminnelse 24 t før (Inngest) + `reminderSentAt`
- [x] CSV-eksport
- [ ] «Ta med følge» (valgfritt per event, se § 10)
- [ ] Automatisk sletting/anonymisering etter eventet (Inngest-cron) — **kreves av personvernteksten**
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
