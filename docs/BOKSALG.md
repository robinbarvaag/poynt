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
ganger. Derfor står de i samme graf («Dag for dag», `sales-chart.tsx`) som to
søyler *ved siden av* hverandre — aldri stablet, aldri summert — og de holdes
i hver sin del av økonomien. Grafen viser alle dager fra første bevegelse til
i dag, også de tomme (`buildDaily` i `dashboard.ts`), fordi spørsmålet den
skal svare på er «rører det seg litt hver dag, eller kommer alt i rykk?».

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
- **Solgt fra bokhandelens hylle** (`hyllesalg`, `SHELF_SOURCE`) er bøker
  Susanne selv solgte eller signerte i en bokhandel — lanseringsfesten,
  signeringer. De kom fra butikkens lager og er allerede betalt gjennom
  innkjøpet, så de holdes **helt utenfor** økonomien, tidslinja for solgt inn
  og returgrunnlaget. Dashbordet viser dem for seg under «Ut av hyllene»
  (`shelfSales`), som en fortelling om hvem som sto bak disken. Lagerhentingen
  fanger de samme bøkene (Norli Stavanger gikk 219 → 196 lanseringshelga), så
  de legges heller ikke til «ut av hyllene»-tallet. Bakgrunnen: 15 + 7 slike
  bøker lå som «innkjøp» etter lanseringen og ble talt tre ganger.

### Forlagssentralen er fasiten for innkjøp

Poynt har tilgang til Forlagssentralens portal (Ordre → Ordresøk, filtrer på
ISBN). Alt Norli og ARK kjøper går som ordrer der, og det er de ordrene Susanne
får oppgjør for. Regelen er derfor: **én «Innkjøp fra bokhandel»-rad per
Forlagssentralen-ordre, med ordrenummeret som referanse** — og aldri en rad for
noe som selges i en butikk etterpå. Sterkeste kontroll: opplaget (2000) minus
lageret hos Forlagssentralen (Øyeblikksrapport) minus Susannes egne eksemplarer
skal være summen av innkjøpsradene. Forhåndssalgene via bok.norli.no skal
ligge som egne Norli-ordrer **i tillegg** til innkjøpet.

Øyeblikksrapporten «Artikkel – ordreinfo» 19.10.2026 viste fasiten for første
runde: Norli 360 (300 Nygata Stavanger, 56 Pottemakerveien = nettlageret og
forhåndssalget, 2 + 2 til to butikker), ARK 303 fordelt på 145 butikker à 2–3,
Biblioteksentralen 4. Boksalg hadde 400 + 94 på Norli — 134 for mye. Regelen
som følger av det: kjør rapporten ukentlig, og hver linje som har økt i
«Kontert» siden sist blir én rad i Boksalg med kundenummeret som referanse.

Biblioteksentralen er egen kanal (`bibliotek`): de kjøper på vegne av
bibliotekene med egen rabatt, så satsen må legges inn under *Kanaler* i
Bokøkonomi (fra fakturaen) før radene kan prises.

Et forhåndssalg er et salg med `saleSource = forhandssalg` — men still
kontrollspørsmålet først: har bokhandelen kjøpt bøkene av deg, eller har kunder
bare reservert dem hos bokhandelen? Bare det første er omsetning. Det andre blir
omsetning den dagen bokhandelen faktisk bestiller, og føres da. Kanaltabellen
viser fordelingen under «Solgt inn» («400 innkjøp · 57 forhåndssalg»), så det
er synlig hva som er ført som hva.

### Forhåndssalg via Norli (og kickback)

Norli har et eget forhåndssalgsprogram for forfatterne sine: kundene bestiller
via én bestemt lenke (`bok.norli.no/verdifull-vekst`), og de salgene har
**andre vilkår enn innkjøpet**. Skrivet fra Norli (høsten 2026) koker ned til
dette, og det er slik dashbordet modellerer det:

| | Innkjøp (de 400 + 300) | Forhåndssalg via lenka |
| --- | --- | --- |
| Hvem har kjøpt | Norli/ARK, til lager | En kunde, og Norli bestiller ekstra |
| Teller | som før | **i tillegg** til innkjøpet |
| Norlis andel | 50 % | **45 %** |
| Returrett | 50 % | ingen — boka er solgt |
| Kickback | nei | **ja**, over 50 bøker |

**Kickback** er en ekstra prosent av *fullpris*, regnet av **alle**
forhåndssalgene så snart antallet passerer et trinn — ikke bare de over
terskelen. 60 bøker gir altså 5 % av 399 × 60, ikke av 10. Trappa høsten 2026:
50 → 5 %, 200 → 7 %, 500 → 8 %, 1000 → 9 %. Norli regner den ut selv etter
forhåndssalget og trekker fra salg som kom via betalte kanaler (Google-annonser
o.l.), så tallet i dashbordet er et **øvre anslag**. Avtalen varer som regel ut
lanseringsuka; salg på selve lanseringsfesten teller på bestselgerlista, men
ikke i kickbacken. Over 500 forhåndssalg utløses en markedspakke i butikk
(plakat verdt 17 000 kr, vindu i Universitetsgata, Meta-annonser, nyhetsbrev,
forsida på norli.no).

Vilkårene ligger i *Bokøkonomi → Kanaler → Norli → Forhåndssalg og kickback*
(`ChannelRates.presale`, typen `PresaleTerms`): sats, trapp, frist og
markedspakke-terskel. Ingenting av det er hardkodet, men `NORLI_PRESALE` i
`constants.ts` er standardverdiene. I regnestykket:

- `presaleRates(channel)` gir kanalen med forhåndssalgssatsen og uten
  returrett. `totals()` tar forhåndssalg som et eget volum (`extras.presale`),
  så de aldri prises til 50 % ved en feil.
- `kickback(settings, terms, copies)` gir trinn, prosent, beløp og hvor langt
  det er til neste trinn. Beløpet legges i `Totals.kickback` og er med i
  `Totals.net` — men holdes utenfor snittet per bok i `coverage()`, for det er
  en bonus på toppen, ikke noe hver neste bok tar med seg.
- Bare forhåndssalg datert til og med fristen (`kickbackUntil`) teller i
  grunnlaget; senere rader teller i salget, men ikke i kickbacken.

**Signert og personlig signert.** Kundene kan krysse av for signert eller
personlig signert, og det er *kun* de eksemplarene som bestilles inn til
signering i butikk — og dermed kun de som kan tas med på lanseringsfesten.
Forhåndssalg-raden i *Boksalg* har derfor feltene «Hvorav signert» og «Hvorav
personlig signert»; dashbordet summerer dem til «Til signering» og sier fra om
rader som mangler tallet. De som glemte å velge signert får boka i posten.

Kortet «Forhåndssalg via Norli» (`components/boksalg/presale-card.tsx`) ligger
øverst i dashbordet **mens avtalen løper**: antall, kickback-trinn og beløp,
dager igjen av avtalen, til signering, trappa med markører og markedspakka.
Hvert trinn og markedspakka er også milepæler. Etter fristen er det ingenting
å påvirke, så kortet blir en kort oppsummering (tre tall, én setning) og
flyttes ned til økonomidelen — `page.tsx` skiller `activePresales` fra
`closedPresales` på `daysLeft`.

### Rekkefølgen på sida

Etter lansering er det bevegelsen ute i butikkene Susanne kan gjøre noe med, så
sida går fra *hvor står vi* til *hva skjer nå* til *bakgrunn*: nøkkeltall med
returscenario → dag for dag (solgt inn og ut av hyllene i én graf) → ute i
butikk → butikkene (kart og oppfølging) → endringslogg → milepæler → hva hver
kanal er verdt → avsluttet forhåndssalg → utgifter. Seksjonene er merket med
`{/* ---- Navn ---- */}`-kommentarer i `page.tsx`, så en omrokering er å
flytte blokker, ikke å skrive dem om.

> Salg ført på en kanal som ikke finnes under *Kanaler* i Bokøkonomi (f.eks.
> «Annet») kan ikke prises og holdes utenfor totalene. Dashbordet varsler om
> det øverst, med antall — endre kanalen på salget, eller legg til kanalen.

### Returrisiko

Bokhandlene kjøper inn med returrett — Norli og ARK kan sende tilbake inntil
50 % av det de kjøpte. Et innkjøp er derfor inntekt, men ikke *sikret* inntekt
før returfristen er ute. Slideren «Hva om bøkene kommer i retur?» ligger
**øverst** i dashbordet (`components/boksalg/return-scenario.tsx`) og styrer
alle tallene i seksjonen under: solgt inn, av opplaget, netto, resultat og
«Veien til null» (tre segmenter: sikret, kan forsvinne ved retur (skravert),
og igjen). Standard er full returrett, altså verst tenkelig — det er tallet
Susanne bør planlegge etter. Kanaltabellen og milepælene lenger ned viser
faktisk ført salg og påvirkes ikke av slideren.

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
| 0 → 2, butikken har hatt boka før | `restock` (2), merket «påfyll etter utsolgt» | nei |
| 0 → 2, butikken har **aldri** hatt boka | `listed` (2) | nei |
| ny butikk på lista | `listed` | nei |
| butikk forsvinner fra lista | `delisted` | **nei** — vi vet ikke om den solgte ut eller stengte |
| forhåndssalg → i salg | `availability` | nei |

Kjente begrensninger, så de ikke må gjenoppdages:

- **Hentingen skjer én gang i døgnet.** To salg og ett påfyll i samme butikk
  samme dag ser ut som ett salg. Det er prisen for å lese lager i stedet for
  kassaapparater.
- **Første snapshot gir null.** Det er en nullstilling, ikke et døgns salg.
- **Kjedene lister alle butikkene sine med 0 før boka er kommet.** Derfor kan
  ikke «0 → 2» alene si om det er første levering eller påfyll etter utsolgt.
  `diffSnapshots` får `everStocked` (butikker med `maxQty > 0` i
  butikk-katalogen) og kaller det `listed` når butikken aldri har hatt boka.
  Norli Kvadrat, Sandnes 19.10.2026 ble feilaktig «påfyll» før denne regelen
  kom; raden er rettet for hånd.
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

Filtrene viser hva som er valgt rett i chipen («Fylke · Oslo»; tre eller flere
blir «3 valgt»), valgte verdier står i menyen selv om de ikke finnes i radene
lenger (ellers kunne de ikke velges bort), «Nullstill» fjerner alle filtre —
også kartets fylkesvalg, siden det er samme ting. Et filter satt utenfra
(kartet) nullstiller sidetallet i `DataTable`, ellers sto man på side 3 av en
liste med fem rader. Butikker uten fylke filtreres som «Ukjent». Handlingene
(kopier e-post) ligger på egen linje under filtrene (`actions`-propen på
`DataTable`). På små skjermer skjules fylke, solgt og adresse med CSS — navn,
status, antall, kontakt og oppfølging er det man trenger med telefonen i hånda.

## Kildene

Én fil per bokhandel i `lib/boksalg/sources/`. Å legge til en ny er å skrive en
`StockSource` og føre den opp i `sources/index.ts` og i valglista i
`lib/boksalg/constants.ts`.

**Norli** (`norli.ts`) er den verdifulle. Magento-basert, med et åpent
GraphQL-endepunkt nettbutikken selv bruker. `pickupStores` gir antall eksemplarer
per fysisk butikk — 197 butikker. Produkt-ID slås opp fra ISBN, ikke hardkodes.

Tallene fra Norli normaliseres før de telles, fordi tre ting kan gi feil tall
uten at noe feiler (alle tre er testet i `sources/norli.test.ts`):

- `id` i `pickupStores.products` og `id` fra produktoppslaget sammenlignes som
  **strenger** — er den ene Int og den andre String, matcher ingen butikk og
  alt teller 0.
- `qty_in_store` kan komme som streng, desimal, null eller **negativt**
  (restordre). `normalizeQty` gjør alt til heltall ≥ 0; et negativt tall ville
  ellers blitt lest som et salg i diff-en.
- Samme butikk i flere regiongrupper telles **én gang** (høyeste beholdning).
  Uten dedupe ble den talt dobbelt, fikk doble salgshendelser og to rader.

Butikker som sto med eksemplarer sist, men mangler i dagens liste, settes til 0
nå (`clearMissing` i `syncStores`) — ellers blir de stående som «har boka» for
alltid. `maxQty` og solgt-estimatet beholdes. Dette skjer ikke når lista er
en lånt katalog (før lansering), for da sier lista ingenting om beholdningen.

**ARK** (`ark.ts`) har et åpent «experience»-API som nettbutikkens butikkvelger
(«Velg butikk» på produktsida) selv bruker, og det gir det samme som Norli:
antall eksemplarer per fysisk butikk pluss e-post, telefon, adresse,
åpningstider og koordinater for alle 155 butikkene.

| Kall | Gir |
| --- | --- |
| `GET experience.api.ark.no/api/product/sku/<isbn>` | pris (`pricesNokOre`, øre), nettstatus (`variantAvailability.onlineAvailability`), butikker med boka (`cncAvailableInStoresCount`) og butikker den kan bestilles til (`orderCncAvailableStoresCount`) |
| `POST …/api/store/availabilities` `{ skus: [isbn] }` | alle butikker, hver med `productAvailability[isbn].availableQuantityInStore` |

ARK oppgir kommune, ikke fylke. Fylket utledes av postnummeret
(`sources/postcode-region.ts`, testet), så ARK-butikkene står i samme
fylkestabell som Norlis; kommunen er reserve. «Kan bestilles til N butikker»
havner i notatet når N er større enn antall butikker med boka — det er
Klikk&Hent-dekningen, ikke hyller med bøker.

Historikk: fram til 20.10.2026 skrapet adapteren produktsida, og det gikk
galt på to måter. Sida bærer bare status og pris (ikke per butikk), og
www.ark.no står bak en WAF som avviser Vercels IP-område med 429 på
millisekunder — en IP-blokk, ikke en ratebegrensning, så verken
nettleser-headere, `Retry-After` eller Firecrawl-omvei var en god løsning.
API-et står **ikke** bak den blokken (det svarer selv på forespørsler uten
nettleser-headere), så det brukes direkte. Svarer det likevel 429/403, kastes
`SourceUnavailableError`: forrige lagerbilde står, neste kjøring prøver igjen,
og dashbordet viser det som informasjon, ikke rød feil. En tom butikkliste
kastes også som feil — API-et gir alltid alle butikkene, så tom liste betyr at
ARK har lagt om, ikke at alle hyllene er tomme.

Har en kilde ikke gitt nytt lagerbilde på over 36 timer, varsler dashbordet
om det øverst, så gamle tall ikke leses som «ingen endring».

**Tidssone.** Alle dagnøkler og tidspunkt regnes i `Europe/Oslo`
(`lib/boksalg/dates.ts`, `components/boksalg/format.ts`). Vercel kjører i UTC;
uten dette havnet en henting kl. 00:30 på gårsdagen, «sist hentet» sto to
timer feil, og server og nettleser formaterte ulikt (hydreringsavvik).

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
# Hent lagerstatus nå (alle kilder, eller én; --force ignorerer minsteintervallet)
bun run --cwd apps/web payload run scripts/fetch-book-stock.ts
bun run --cwd apps/web payload run scripts/fetch-book-stock.ts norli
bun run --cwd apps/web payload run scripts/fetch-book-stock.ts ark --force

# Seed utgiftene (create-only — rører aldri noe som finnes)
bun run --cwd apps/web payload run scripts/seed-book-expenses.ts

# Avstemmingen mot Forlagssentralen 19.10.2026 (tørrkjøring uten «apply»;
# bibliotek=NN er Biblioteksentralens andel fra fakturaen). Kan kjøres flere ganger.
bun run --cwd apps/web payload run scripts/fix-book-sales-2026-10.ts
bun run --cwd apps/web payload run scripts/fix-book-sales-2026-10.ts apply bibliotek=45

# Testene for økonomi og diff-logikk
bun test apps/web/lib/boksalg
```

## Filkart

| Fil | Ansvar |
| --- | --- |
| `lib/boksalg/economy.ts` | Netto per bok, break-even, dekning. Ren regning, testet |
| `lib/boksalg/diff.ts` | Salg vs. påfyll vs. delisting. Ren logikk, testet |
| `lib/boksalg/sources/` | Én adapter per bokhandel; `http.ts` har nettleser-headere, `Retry-After` og `SourceUnavailableError` |
| `lib/boksalg/dates.ts` | Dagnøkler og dager-til i norsk tid. Testet |
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
| `components/boksalg/` | Grafer (Recharts), kart m/ zoom, butikkliste (DataTable), returscenario (slider + nøkkeltall + veien til null), forhåndssalgskort, miks-simulator, milepæler, lagerfaner |
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

**Zoom og panorering.** En SVG-`transform` på en `<g>` rundt sti og prikker,
animert med `requestAnimationFrame` (logaritmisk på skalaen). *Ikke*
CSS-transition: Chrome rasteriserer et CSS-transformert lag i lav oppløsning
mens det beveger seg, og ved 40× blir kartet grøt. Velges et fylke, regnes
utsnittet fra butikkenes bbox (`viewForRegion`, maks 12×). Pluss/minus zoomer
rundt midten, dra flytter, klem (to fingre) zoomer på mobil; alt manuelt
gjelder bare for det valgte fylket. Maks 80× — nok til å skille
Oslo-butikkene. Prikkene deles på skalaen så de holder synlig størrelse
(vokser med √skala, tak 1,8×). Fokusrammen på sirklene er slått av og
erstattet med strek — nettleserens outline tegnes som en boks og skaleres med
transformen. Pointer capture er med vilje IKKE brukt: da går `click` til
svg-en og prikkene slutter å reagere.

Tre ting som var feil, og hvordan de er løst:

- **Dra hakket.** Dra ble regnet fra React-state; flere `pointermove` mellom
  to render leste samme utgangspunkt. Nå regnes dra og klem fra `targetRef`,
  som oppdateres synkront i `setView`. Dra avsluttes også på `pointerleave`,
  så et dra ut av kartet ikke henger igjen.
- **Kartet stjal scrollen.** Hjulet zoomet alltid (ikke-passiv lytter med
  `preventDefault`), så sida stoppet for alle som rullet forbi — og på mobil
  fanget `touch-action: none` hvert sveip over et kart i full bredde. Nå
  zoomer hjulet bare når kartet er «i bruk» (fylke valgt eller zoomet inn)
  eller med Ctrl/⌘ (trackpad-klem sender ctrlKey). På mobil er `touch-none`
  bare på når kartet er zoomet; ved hele landet er det `touch-pan-y`, så sida
  scroller. Hint-teksten under kartet skifter med `@media (hover)`.
- **Tooltip på mobil.** Trykk på en prikk setter tooltipen (ikke bare hover),
  trykk på bakgrunnen lukker den. Terskelen for «dette var et dra, ikke et
  trykk» er 10 px for finger, 4 px for mus.

**Navn og «lys».** Fra 10× tones omrisset ned og butikknavnene tegnes i et
eget `<g>` utenfor zoom-gruppa, i skjermenheter, med enkel grådig
kollisjonshåndtering (`placeLabels`: høyre, venstre, under, over, ellers
skjult). Butikker med `recentSales > 0` (salgshendelser siste sju dager, fra
`book-stock-events` per `sourceKey:storeId`) får en pulserende SMIL-ring og
egen legende «Solgt siste uke».

Kartet er egenbygd i stedet for Leaflet med vilje: ingen tile-leverandør,
ingen ekstra avhengighet, og butikkene er punkter uten behov for gater.
Trengs gatekart senere, er Leaflet + OpenStreetMap et alternativ — men
punktene, zoom-tilstanden og fylkesvalget kan gjenbrukes som de er. Genereringsscriptet ligger ikke i repoet; det er ~60
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
