# Ytelsesmåling (Lighthouse)

Vi måler poynt.no med Lighthouse i en GitHub Action, slik at tallene kan sammenlignes fra
uke til uke. Oppsettet ligger i `.github/workflows/lighthouse.yml` og `.github/lighthouse/`.

## Kjøre målingen

- **Automatisk:** hver mandag kl. 05:00 UTC mot https://www.poynt.no.
- **Manuelt:** GitHub → Actions → «Lighthouse» → «Run workflow». La adressefeltet stå tomt
  for produksjon, eller lim inn en Vercel-preview (`https://poynt-xyz.vercel.app`) for å måle
  en endring før den går ut. Ligger previewen bak Vercel Deployment Protection, må
  repo-hemmeligheten `VERCEL_AUTOMATION_BYPASS_SECRET` være satt — ellers måler du
  innloggingssiden til Vercel. Hemmeligheten trengs ikke for produksjon.

Sju sider måles: forsiden, `/tjenester`, `/produkter`, `/blogg`, `/kundehistorier`, ett
blogginnlegg og én tjenesteside (lista står i `.github/lighthouse/lighthouserc.cjs`). Hver side
kjøres 3 ganger på mobil og 3 ganger på desktop. En kjøring tar rundt 10 minutter.

## Lese resultatet

Åpne kjøringen og se på **Summary**. Der står én tabell for mobil og én for desktop:

- **Ytelse** – Lighthouse-scoren (0–100), medianen av de tre kjøringene.
- **Spredning** – laveste og høyeste score av de tre. Stort sprik betyr en urolig måling;
  kjør på nytt før du trekker noen konklusjon.
- **LCP** – tiden til det største elementet (som regel toppbildet) er på plass. Mål: under 2,5 s.
- **CLS** – hvor mye siden hopper mens den laster. Mål: under 0,1.
- **TBT** – hvor lenge JavaScript blokkerer siden. Mål: under 200 ms.

⚠️ betyr at tallet er utenfor startbudsjettet (ytelse minst 80 på mobil og 90 på desktop, pluss
grensene over). Det er bare et varsel — workflowen feiler aldri på dårlige tall. Under
«Største forbedringsmuligheter» står de tre tiltakene Lighthouse mener sparer mest tid per side.
De fullstendige rapportene (HTML og JSON for alle kjøringene) ligger som artifacts nederst på
kjøringen og kan åpnes i nettleseren.

## Hvorfor tallene spriker mellom verktøyene

Lighthouse er en *labmåling*: én maskin laster siden med kunstig tregt nett og treg prosessor
og regner ut en score. Scoren avhenger av maskinen, nettet og tilfeldigheter i den ene
kjøringen. Derfor kan samme side få 64 og 97 med få minutters mellomrom.

- **PageSpeed Insights** kjører Lighthouse én gang på Googles delte servere. Belastningen der
  varierer, og én kjøring er nok til at tallet hopper. PSI viser også feltdata fra ekte
  Chrome-brukere (CrUX) når trafikken er høy nok. poynt.no har for lite trafikk, så den delen
  er tom («ingen data») — det er ikke en feil.
- **Lokal Lighthouse** (DevTools) bruker din egen maskin og ditt eget nett. En rask PC gir
  bedre tall enn Googles servere, og utvidelser i nettleseren, åpne faner og innlogget
  admin-linje påvirker resultatet. Kjør i inkognitovindu hvis du vil ha et renest mulig tall.
- **Denne workflowen** kjører på en GitHub-runner med låst Lighthouse-versjon, samme
  innstillinger hver gang og medianen av tre. Runnerne er heller ikke helt like fra gang til
  gang, men spriket blir mye mindre.

Mobiltallene er dessuten *simulerte*: Lighthouse laster siden raskt og regner seg fram til
hvordan den ville gått på en middels mobil med tregt 4G. Derfor kan LCP stå som 6 sekunder
selv om siden kjennes rask på din egen telefon.

## Hvilket tall skal jeg stole på?

- **Har siden blitt bedre eller dårligere?** Bruk denne workflowen og sammenlign med forrige
  kjøring. Det er utviklingen på samme oppsett som teller, ikke selve tallet. Noen få poeng
  opp eller ned er støy.
- **Hva bør vi fikse?** Forbedringsmulighetene i oppsummeringen og HTML-rapportene.
- **Hvordan har ekte besøkende det?** Det kan ikke Lighthouse svare på. Det krever feltdata:
  Core Web Vitals målt hos faktiske brukere, fra Vercel Speed Insights eller CrUX.
- **Hva betyr noe for Google-rangeringen?** Bare Core Web Vitals fra feltdata (LCP, INP, CLS
  hos ekte brukere). Lighthouse-scoren brukes ikke i rangeringen, og en score på 76 mot 90 gir
  ikke i seg selv dårligere plassering.

## Status for feltdata (november 2026)

Vi har ingen feltdata i dag. `@vercel/speed-insights` er ikke installert i `apps/web` — bare
`@vercel/analytics`, som teller sidevisninger og hendelser, ikke Core Web Vitals. CrUX har
heller ikke nok trafikk til å vise tall for poynt.no. Vil vi vite hvordan siden oppleves for
ekte besøkende, er neste steg å slå på Speed Insights i Vercel og legge til pakken.

## Endre oppsettet

Sider, antall kjøringer og budsjett står i `.github/lighthouse/lighthouserc.cjs`. Tabellen
lages av `.github/lighthouse/summary.mjs`. Lighthouse-versjonen er låst via `LHCI_VERSION` i
workflowen. Oppgraderer du den, kan tallene flytte seg uten at siden har endret seg.
