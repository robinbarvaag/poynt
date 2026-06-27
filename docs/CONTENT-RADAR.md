# Innholdsradar — redaksjonell AI-assistent i Payload admin

> Status: under bygging. Fase 0 (fundament) først. Dette dokumentet er kilden til
> sannhet for arkitektur og faseinndeling, og skal overleve på tvers av brancher.

## 1. Hva og hvorfor

Et redaksjonelt assistent-system i Payload admin som hjelper partneren (innholds-
ansvarlig) med å bestemme **hva On Poynt bør lage, oppdatere, promotere eller
gjenbruke** av innhold til medlemmene. Det skriver ikke teksten — det forteller
*hva man bør skrive om* og *hva man bør lage*.

Leveres som:

- **«Bindersen»** — en vennlig widget på admin-dashboardet med 3–5 handlingskort.
- **En full oversikt** på `/admin/radar` med filtre og handlinger (snooze/avvis/ferdig).
- **Inngest-jobber** som kjører analysen periodisk og henter ekstern inspirasjon.

### Avgrensning mot eksisterende verktøy

| | Medlems-verktøyene (finnes) | Innholdsradaren (dette) |
|---|---|---|
| Hvem | Hvert medlem | Partner / redaksjon |
| Hvor | On Poynt-appen | Payload admin |
| Mål | Lag innhold for **min** bedrift | Bestem hva **On Poynt** skal lage |
| Data | Workspace-profil + brand brief | Payload-collections + `plannerToolResult` + ekstern inspirasjon |

## 2. Arkitektur-prinsipper

1. **Deterministisk på fakta, AI på fortelling.** Signalene (alder, gap, etterspørsel)
   regnes ut i kode. AI bruker kun fakta til å formulere forslag — finner ikke på tall.
2. **Inngest som durable runtime.** Steps, retries, fan-out, scheduling og
   concurrency-limits på scraping. `inngest dev` lokalt.
3. **Førstepartsdata foran scraping.** `plannerToolResult` (hva medlemmene faktisk
   genererer) er sterkere etterspørselssignal enn noe vi scraper.
4. **Ærlig om analytics-gapet.** Vi har ingen visningsdata. «Promoter på nytt»-forslag
   er proxy-baserte (alder/featured-rotasjon) til vi evt. legger til lettvekts
   visningstelling (Fase 4). Verktøyet later aldri som det vet popularitet det ikke vet.
5. **Stabil identitet på forslag.** Hvert forslag har en `dedupKey`; ny kjøring
   *oppdaterer* i stedet for å duplisere, og `dismissed` forblir `dismissed`.
6. **Alt partneren rører ved er DB-drevet.** Prompts i Prompt-maler, inspirasjons-
   kilder i settings — justerbart uten kode.

## 3. Datamodell (`planner`-schema, via `plannerSchema.table`)

Følger eksisterende On Poynt-mønster (samme schema som `plannerPromptTemplate`).

### `planner_content_suggestion`
| felt | type | notat |
|---|---|---|
| id | text PK | `crypto.randomUUID()` |
| dedupKey | text, unik | `type:targetCollection:targetId` eller `type:category:slug` |
| type | text | `create` \| `refresh` \| `promote` \| `repurpose` |
| title | text | kort handlingstittel |
| rationale | text | hvorfor (AI-formulert) |
| targetCollection | text? | f.eks. `courses`, `articles` |
| targetId | text? | id i Payload hvis forslaget peker på eksisterende innhold |
| category | text? | kategori-slug forslaget gjelder |
| priority | integer | score 0–100 (deterministisk) |
| status | text | `new` \| `snoozed` \| `done` \| `dismissed` |
| evidence | jsonb | signalene som ga forslaget (revisjon/forklaring) |
| source | text | `radar` \| `inspiration` |
| runId | text? | hvilken kjøring som genererte/oppdaterte det |
| createdAt / updatedAt | timestamp | |

### `planner_inspiration_source`
`id`, `label`, `url`, `type` (`rss` \| `website`), `personName?`, `isActive`,
`cadence`, `lastFetchedAt`, `createdAt`, `updatedAt`.

### `planner_inspiration_item`
`id`, `sourceId`, `title`, `url`, `summary`, `topics` (jsonb), `publishedAt`,
`createdAt`.

### `planner_radar_run`
`id`, `trigger` (`scheduled` \| `manual` \| `heartbeat`), `status`
(`running` \| `ok` \| `error`), `startedAt`, `finishedAt?`, `stats` (jsonb),
`error?`. Revisjonsspor for hver kjøring.

## 4. Signaler radaren regner ut (Lag 1-input)

Leses via **Payload Local API** (innhold) + **Drizzle** (`plannerToolResult`):

- **Foreldet innhold** — `publishedAt`/`updatedAt` eldre enn N mnd, per collection.
- **Fastlåste drafts** — `status=draft` som har stått stille.
- **Kategori-dekning** — antall per `categories` på tvers → underdekte/ubrukte kategorier.
- **Featured-rotasjon** — featured som har ligget lenge; sterkt innhold aldri featured.
- **Etterspørsel** — topp-temaer/verktøy fra `plannerToolResult` siste 30/90 dager.
- **Inspirasjons-gap** — eksterne temaer (`inspiration_item`) uten match internt.

## 5. AI-syntese

`packages/planner-api/lib/content-radar.ts` — samme mønster som de andre verktøyene:
`resolveSystemPrompt("content-radar-system")` → `streamText`/`generateText` med
`Output.object` + zod. Signalene mates inn som strukturert kontekst; output er en
liste forslag med `type`, `title`, `rationale`, `priority`.

To nye DB-drevne prompts (seedes i `defaultPromptTemplates`, redigerbare i Prompt-maler):

- `content-radar-system` — gjør signaler om til forslag.
- `inspiration-distill-system` — gjør scrapede artikler om til «temaer vi ikke dekker».

## 6. Inngest-funksjoner

- `radar/heartbeat` *(Fase 0)* — bevis-jobb, skriver en `radar_run`-rad.
- `radar/analyze` *(Fase 1)* — scheduled (ukentlig) + on-demand event
  `radar/analyze.requested`. Samler signaler → AI-syntese → upsert forslag → revisjon.
- `inspiration/fetch` *(Fase 3)* — scheduled, fan-out per aktiv kilde (concurrency-
  limit), scraper via Firecrawl/RSS → `inspiration_item` → distill → mater gap-analysen.

Endepunkt: `apps/web/app/api/inngest/route.ts`. Klient: `apps/web/lib/inngest/client.ts`.
Lokalt: `npx inngest-cli dev`.

## 7. Admin-UI

- **Widget**: `beforeDashboard` i `payload.config.ts` → topp-forslag + «Se alle».
- **Full view** `/admin/radar`: liste m/filtre (type/status), handlinger via server
  actions (snooze/avvis/ferdig), «Kjør radaren nå» (sender Inngest-event), siste-kjøring.
- **Settings** for inspirasjonskilder: CRUD (gjenbruker `industries-table`-mønsteret).
- Husk `payload generate:importmap` etter nye admin-komponenter.

## 8. Faseplan

- **Fase 0 — Fundament.** Inngest (klient + route + dev), 4 `planner_*`-tabeller +
  migrasjon, to nye prompt-maler, `radar/heartbeat` bevis-jobb.
- **Fase 1 — Radar-motoren.** Signal-innsamling + AI-syntese + upsert + revisjon;
  trigget av event og ukentlig schedule.
- **Fase 2 — Widget + admin-view.** «Bindersen» + `/admin/radar` + handlinger.
- **Fase 3 — Ekstern inspirasjon. ✅** Kilde-CRUD (`/admin/inspirasjon`) + Inngest
  `inspiration/fetch` (RSS uten avhengighet + Firecrawl for nettsider) → distill →
  `inspiration_item` → `inspiration_gap`-signaler i gap-analysen. Verifisert ende-til-ende.
- **Fase 4 — Lettvekts visningstelling. ✅** `planner_content_view` (aggregert per dag,
  ingen PII, migrasjon 0009), `/api/radar/track`-beacon + `<ViewTracker>` på alle fem
  innholds-detaljsidene (artikler/kurs/ressurser/blogg/podkast), og view-baserte
  `popular`-signaler som gjør «promoter/oppdater/gjenbruk»-forslag datadrevne i stedet
  for proxy-baserte. Dormant til visninger akkumuleres. Verifisert. Brand-visuals
  (logo/swatches/fonter) er eget spor (Robin).

## 9. Ærlige forbehold

- **LinkedIn/Twitter-profiler kan vi ikke scrape** (auth-gated + ToS). «Flinke folk»
  realiseres via deres **offentlige RSS/blogg/nyhetsbrev**, ikke selve profilen.
- **Ingen ekte popularitetsdata** før Fase 4. Promoter-forslag er proxy-baserte til da.

## 10. Migrasjoner

Nye tabeller i eksisterende `planner`-schema:
`bun run planner:generate` → review generert SQL → `bun run planner:migrate`.
(Ingen `CREATE SCHEMA`-prepend — det gjelder kun baseline.) Se `docs/MIGRATIONS.md`.
