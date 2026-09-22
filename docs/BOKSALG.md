# Boksalg — sporing og økonomi for «Verdifull vekst»

Dashbordet på **`/intern/boksalg`** svarer på tre spørsmål: hvor mange bøker er
solgt, hva sitter Susanne igjen med, og hvor langt er det igjen til utgivelsen
har gått i null.

Boka: *Verdifull vekst – i din bedrift*, ISBN `9788230375334`, Poynt forlag,
utgitt 15. oktober 2026, 399 kr overalt.

## Hvorfor det ligger der det ligger

Dataene er delt i to, fordi Payload-admin og frontend er gode på hver sin ting:

| Del | Hvor | Hvorfor |
| --- | --- | --- |
| Utgifter, manuelle salg, satser | Payload-collections | CRUD-skjema, validering, kvitteringsopplasting og versjonering gratis |
| Automatisk henting | Inngest-cron | Allerede wiret opp på Vercel |
| Selve dashbordet | `/intern/boksalg` | Payload-admin har verken Tailwind, `@poynt/ui` eller grafer — frontend har alt tre |

Begge halvdeler krever **Payload-innlogging**. Dashbordet sjekker sesjonen selv
(`payload.auth`) og sender deg til `/admin/login` uten. `/intern` er lagt til i
`robots.ts`.

## Økonomimodellen

Regnestykket står i `lib/boksalg/economy.ts` og er dekket av tester. Per solgt
bok:

```
netto = 399
      − forhandlerens andel      (Norli og ARK: 50 %)
      − redaktørens andel        (10 %, av brutto eller netto — se under)
      − distribusjon             (Forlagsentralen: % og/eller kr per bok)
      − kortgebyr                (egen nettbutikk: Stripe 1,4 % + 2 kr)
```

**Trykk står bevisst ikke i den lista.** Boka trykkes i opplag og hele fakturaen
betales opp front, akkurat som design og redaktørhonorar — så trykk er en rad i
Bokutgifter, altså en del av nevneren break-even skal dekke. Trakk vi i tillegg
en trykkekostnad fra hvert salg, ville opplaget blitt betalt to ganger i
regnestykket. Distribusjon og kortgebyr står derimot med, fordi de påløper per
salg.

**Redaktørens grunnlag er et valg, ikke en antakelse.** Avtalen kan lese 10 % av
utsalgsprisen eller 10 % av det som står igjen etter bokhandelen, og forskjellen
er ca. 20 kr per bok i bokhandel:

| | Redaktør av brutto | Redaktør av netto |
| --- | --- | --- |
| Norli / ARK | 159,60 kr | 179,55 kr |
| Egen nettbutikk | 359,10 kr | 359,10 kr |

Valget står i **Bokøkonomi → Fordeling**. I egen nettbutikk er de to like, siden
ingen forhandler tar noe først.

> Mangler trykkefakturaen under Bokutgifter, er utgiftssummen for lav og boka
> ser nærmere break-even ut enn den er. Dashbordet sier fra om det øverst.

## Solgt inn vs. ut av hyllene

Dette er det viktigste skillet i hele oppsettet, og det som er lettest å regne
feil.

**Solgt inn** er når Susanne får betalt. Kjøper Norli 400 eksemplarer, er det 400
salg for henne den dagen — uavhengig av hvor fort de går ut av hylla etterpå.
Hit hører:

1. **Bokhandlernes innkjøp** — føres manuelt i *Boksalg*.
2. **Avregninger fra distributøren** — føres manuelt i *Boksalg*.
3. **Foredrags- og direktesalg** — føres manuelt i *Boksalg*.
4. **Bestillinger i egen nettbutikk** — telles automatisk fra `orders`. Krever at
   boka er koblet i *Bokøkonomi → Boka i nettbutikken*. Skal **ikke** føres
   manuelt i tillegg.

**Ut av hyllene** er når kunden kjøper boka i butikken, utledet av at Norlis
lagertall gikk ned. Det er **ikke omsetning** — de bøkene ble betalt for da
bokhandelen kjøpte dem inn. Legges de to sammen, telles de samme bøkene to
ganger, og det er nettopp derfor dashbordet holder dem i hver sin seksjon og hver
sin graf.

Ut av hyllene er likevel det mest handlingsrettede tallet: går hyllene fort
tomme, kommer det en etterbestilling — og *den* er omsetning.

### Hva velger jeg når jeg fører et salg?

**Kanalen** avgjør regnestykket per bok — den bestemmer hvilke kutt som trekkes
fra, og forskjellen er over det dobbelte (159,60 kr hos Norli mot 351,51 kr i
egen nettbutikk). Velg den ut fra *hvem som betalte deg*.

**«Hva slags salg»** styrer to ting, og er ellers en merkelapp:

- **Innkjøp fra bokhandel** er det eneste bokhandelen kan *returnere* fra (se
  Returrisiko under). Forhåndssalg, avregninger og foredragssalg er bøker som
  har gått til en kunde og kommer ikke tilbake.
- **Retur fra bokhandel** trekkes fra i stedet for å legges til. Antallet føres
  positivt; typen gjør resten. Den senker både «solgt inn» og grunnlaget
  bokhandelen kan returnere fra.

Et forhåndssalg er et vanlig salg med `saleSource = forhandssalg` — men still
kontrollspørsmålet først: har bokhandelen kjøpt bøkene av deg, eller har kunder
bare reservert dem hos bokhandelen? Bare det første er omsetning. Det andre blir
omsetning den dagen bokhandelen faktisk bestiller, og føres da. Kanaltabellen
viser fordelingen under «Solgt inn» («400 innkjøp · 57 forhåndssalg»), så det
er synlig hva som er ført som hva.

### Returrisiko

Bokhandlene kjøper inn med returrett — Norli og ARK kan sende tilbake inntil
50 % av det de kjøpte. Et innkjøp er derfor inntekt, men ikke *sikret* inntekt
før returfristen er ute. «Veien til null» viser tre segmenter: sikret,
kan forsvinne ved retur (skravert), og igjen. Slideren under
(`components/boksalg/return-simulator.tsx`) lar en se hva X % retur gjør med
dekningen og antall bøker igjen; standard er full returrett, altså verst
tenkelig.

Returretten per kanal ligger i *Bokøkonomi → Kanaler → Returrett (%)* og bor på
`ChannelRates.maxReturnPercent`. Regnestykket er `returnRisk()` i
`lib/boksalg/economy.ts` (testet): grunnlag = innkjøp − ført retur per kanal,
hver kanal kappes ved sin egen returrett, tapt netto = returnerte × netto per bok
i kanalen.

### «Hva om»-simulatoren

Under kanaltabellen ligger en simulator (`components/boksalg/mix-simulator.tsx`)
der man drar i en slider og ser hvor mange bøker som må selges ved en gitt
fordeling mellom to kanaler. Kurven viser hele spennet fra 0 til 100 %, fordi
det er vippepunktet som er interessant — ikke ett enkelt tall.

Den importerer `unitEconomics` fra `lib/boksalg/economy.ts` i stedet for å ha
sin egen kopi av regnestykket. Endepunktene på kurven skal alltid være identiske
med break-even-kolonnen i tabellen over; er de ikke det, har noen laget en
parallell utregning.

### Hvordan «ut av hyllene» utledes

Vi leser hvor mange eksemplarer hver fysiske butikk har på hylla. Går tallet ned,
har boka sannsynligvis forlatt hylla. Går det opp, er det påfyll.
`lib/boksalg/diff.ts` skiller dem, og bare `sale`-hendelser teller:

| Hva som skjedde | Type | Teller som salg |
| --- | --- | --- |
| 4 → 2 | `sale` (2) | ja |
| 2 → 0 | `sale` (2), merket «utsolgt» | ja |
| 2 → 12 | `restock` (10) | nei |
| ny butikk på lista | `listed` | nei |
| butikk forsvinner fra lista | `delisted` | **nei** — vi vet ikke om den solgte ut eller stengte |
| forhåndssalg → i salg | `availability` | nei |

Kjente begrensninger, så de ikke må gjenoppdages:

- **Hentingen skjer én gang i døgnet.** To salg og ett påfyll i samme butikk
  samme dag ser ut som ett salg. Det er prisen for å lese lager i stedet for
  kassaapparater.
- **Første snapshot gir null.** Det er en nullstilling, ikke et døgns salg.
- **Tallet påvirker aldri økonomien.** Det er med vilje: se skillet over.

## Butikkene og oppfølgingen

«Butikker» (`collections/book-stores.ts`) er én rad per fysisk butikk hos en
kjede: navn, by, fylke, e-post, telefon, adresse, åpningstider, koordinater og
lagertall — pluss Susannes egen oppfølging (status, dato, notat).

Ett prinsipp styrer samlingen: **kjedefeltene skrives av hentingen og
overskrives hver gang; oppfølgingsfeltene røres aldri.** `lib/boksalg/stores.ts`
sender bare kjedefeltene i oppdateringen, og Payloads lokale API gjør delvise
oppdateringer, så det Susanne har skrevet overlever at lagertallet oppdateres
hver morgen. Testet i `stores.test.ts`.

Status utledes, ikke lagres: `har_boka` (eksemplarer nå), `gatt_tom` (0 nå, men
`maxQty` > 0 — har hatt boka i en måling), `ikke_hatt` (0 i alle målinger). En
butikk kan ha solgt ut før første måling og se ut som «ikke hatt».

### Katalogen før lansering

Norlis `pickupStores` krever en gyldig produkt-ID, og for en bok som ikke er i
hentesystemet ennå svarer den med **tom liste** — også for butikkene uten boka.
Så før lansering finnes det ingen butikkliste for vår ISBN.

Løsning: `norliSource.fetchStoreDirectory()` søker på et generisk ord
(«kokebok»), tar første treff som gir butikker, og returnerer dem med qty 0.
Hentingen bruker den bare når vårt eget snapshot er tomt. Etter lansering kommer
alle 197 butikker med i vårt eget snapshot og fallbacken brukes ikke. Det
betyr at Susanne kan begynne å ringe butikker **nå**, tre uker før boka er ute.

Én adresse hos Norli har et ledende mellomrom (« akademisk.uib@…»); adapteren
trimmer, og `email` er et `text`-felt i Payload — ikke `email` — så én rar
adresse aldri velter hele hentingen.

### Arbeidsflyten i dashbordet

Kart, fylketabell og butikkliste deler ett fylkesvalg (`stores-section.tsx`):
klikk på en prikk eller en fylkesrad, og lista filtreres. «Til oppfølging»
setter statusfilteret til gått tom + ikke hatt. Velg rader og «Kopier
e-postadresser» (ingen valgt = alle i lista). Oppfølgingsstatus settes rett i
tabellen (`setStoreFollowUpAction`); notater skrives i admin via lenka på raden.

## Kildene

Én fil per bokhandel i `lib/boksalg/sources/`. Å legge til en ny er å skrive en
`StockSource` og føre den opp i `sources/index.ts` og i valglista i
`lib/boksalg/constants.ts`.

**Norli** (`norli.ts`) er den verdifulle. Magento-basert, med et åpent
GraphQL-endepunkt nettbutikken selv bruker. `pickupStores` gir antall eksemplarer
per fysisk butikk — 197 butikker. Produkt-ID slås opp fra ISBN, ikke hardkodes.

**ARK** (`ark.ts`) har ikke noe API. Produktsiden `ark.no/produkt/<isbn>` bærer to
maskinlesbare kilder: JSON-LD (pris, schema.org-tilgjengelighet) og Next.js-
nyttelasten med ARKs egen tilstand (`availability.online.state`,
`availability.store.state`). ARK oppgir **ikke** antall per butikk — så lenge
`store.state` er `unavailable` finnes det ingen butikkliste. Når boka kommer i
butikk må adapteren utvides; inntil da er ARKs bidrag status og pris.

**Adlibris og Bokkilden** er rene nettbutikker uten butikklager. Der finnes det
ikke noe tall å telle — på sikt er salgsrangering det nærmeste, og det er en
trend-indikator, ikke et antall.

## Når ting kjører

Inngest-funksjonen `book-stock-snapshot` går **hver morgen 06:00 UTC** (08:00
norsk sommertid), og lytter på eventet `boksalg/snapshot.requested`.
«Hent nå»-knappen i dashbordet kjører hentingen direkte i en server action i
stedet — den tar et par sekunder, og da slipper man å lure på om køen gikk
gjennom.

Én kilde som feiler tar ikke med seg de andre, og vi skriver **aldri** et tomt
lagerbilde ved feil — neste kjøring ville lest det som «alle butikker tømt».

## Kommandoer

```bash
# Hent lagerstatus nå (alle kilder, eller én)
bun run --cwd apps/web payload run scripts/fetch-book-stock.ts
bun run --cwd apps/web payload run scripts/fetch-book-stock.ts norli

# Seed utgiftene (create-only — rører aldri noe som finnes)
bun run --cwd apps/web payload run scripts/seed-book-expenses.ts

# Testene for økonomi og diff-logikk
bun test apps/web/lib/boksalg
```

## Filkart

| Fil | Ansvar |
| --- | --- |
| `lib/boksalg/economy.ts` | Netto per bok, break-even, dekning. Ren regning, testet |
| `lib/boksalg/diff.ts` | Salg vs. påfyll vs. delisting. Ren logikk, testet |
| `lib/boksalg/sources/` | Én adapter per bokhandel |
| `lib/boksalg/snapshot.ts` | Henter, lagrer lagerbilde, skriver endringslogg |
| `lib/boksalg/dashboard.ts` | Samler alt dashbordet trenger i ett kall |
| `lib/inngest/functions/book-stock.ts` | Cron |
| `globals/book-economy.ts` | Bokøkonomi (satser, kanaler, kilder) |
| `collections/book-expenses.ts` | Utgifter |
| `collections/book-sales.ts` | Manuelle salg og avregninger |
| `collections/book-stock-snapshots.ts` | Rådata per henting |
| `collections/book-stock-events.ts` | Endringsloggen |
| `collections/book-stores.ts` | Butikker med kontaktinfo og oppfølging |
| `lib/boksalg/stores.ts` | Synk av butikkrader; rører aldri oppfølgingsfeltene. Testet |
| `app/(intern)/intern/boksalg/` | Dashbordet + server actions (hent nå, oppfølging) |
| `components/boksalg/` | Grafer (Recharts), kart m/ zoom, butikkliste (DataTable), miks- og retur-simulator, milepæler, lagerfaner |
| `lib/boksalg/milestones.ts` | Milepælene («500 bøker», «boka i alle fylker», «i null») — ren regning på dashbord-tallene, testet |
| `packages/ui/components/{table,data-table,chart}.tsx` | Primitivene, gjenbrukbare i hele appen |

## Grafer, tabeller og kart

Dashbordet bruker tre nye `@poynt/ui`-primitiver (alle med story + MDX i
`apps/storybook/stories/Components/`):

| Primitiv | Bygger på | Brukes til |
| --- | --- | --- |
| `Table` m/ `TableHeader`… | ren HTML (shadcn) | kanaltabell, fylketabell, endringslogg |
| `DataTable` + `createDataTableColumnHelper` | TanStack Table **v9** | butikklista |
| `ChartContainer` + `ChartTooltip`/`ChartLegend` | Recharts 3 | alle grafene |

**TanStack v9 er ikke v8.** `useTable` (ikke `useReactTable`), funksjoner
registreres i `tableFeatures({...})` med row-model-slots, kolonner bruker
`sortFn`/`filterFn` (ikke `sortingFn`), state-typen heter `ColumnVisibilityState`.
Fasettfiltre bruker `filterFn: "oneOf"` (vårt eget, registrert i
`dataTableFeatures`) — TanStacks `arrIncludesSome` forventer at radverdien er
en liste og gir null treff på en vanlig strengkolonne.
Pakken skipper egne agent-skills i `node_modules/@tanstack/react-table/skills/`
— les dem før du endrer `data-table.tsx`. `DataTable` eier ikke tilstanden
selv; React gjør (`state` + `on*Change`), så en forelder kan styre f.eks.
fylkesfilteret.

`recharts` ligger både i `packages/ui` (chart-primitivene) og `apps/web`
(grafene importerer `Bar`, `XAxis` osv. direkte).

Storybook har ingen test-runner konfigurert, så play-testene i
`DataTable.stories.tsx` kjøres ikke automatisk — de fungerer i Storybook-UI-et.

### Kartet

`components/boksalg/norway-map.ts` er et forenklet omriss av fastlands-Norge som
SVG-sti, generert fra Natural Earth-data (public domain, via
`datasets/geo-countries`). Mercator, Douglas-Peucker 1,4 px, 46 polygoner.
`projectNorway(lat, lon)` bruker samme projeksjon og bbox som stien — endres én,
må begge regenereres. Den avrunder til én desimal med vilje (hydrering: `Math.tan`
gir ulik 16. desimal på server og klient).

**Zoom** er en CSS-transform på en `<g>` rundt sti og prikker, ikke en ny
viewBox — da kan den animeres. Velges et fylke, regnes utsnittet fra
butikkenes bbox (`viewForRegion`); pluss/minus zoomer videre rundt samme punkt
og gjelder bare for det fylket. Prikkenes radius og streker deles på skalaen så
de holder synlig størrelse (radius vokser med √skala). Fokusrammen på sirklene
er slått av og erstattet med strek — nettleserens outline tegnes som en boks og
skaleres med transformen. Genereringsscriptet ligger ikke i repoet; det er ~60
linjer Node som leser GeoJSON-en, filtrerer bort Svalbard/Jan Mayen/Bouvetøya
(`lat > 55 && lat < 71.5 && lon > 3` — Bouvetøya på 54°S sniker seg ellers
gjennom), projiserer, forenkler i piksler og skriver fila.

## Om fargene i grafene

Poynt-fargene (`#29664f`, `#eac435`, `#ff99ad`, `#abe3e3`) er flate- og
aksentfarger. Som datamerker faller de på lyshetsbånd, kromafloor og kontrast mot
hvit. Datafargene i `components/boksalg/chart-tokens.ts` er steget ned i samme
hue-familier til de består alle seks sjekkene — endres en av dem, kjør
palettvalidatoren på nytt før det committes.

Estimerte tall er i tillegg **skravert** (`hatch-pattern.tsx`), slik at
usikkerheten leses uten farge. Butikkstatus har egne farger (`STATUS_COLORS`) som
alltid står sammen med tekst.
