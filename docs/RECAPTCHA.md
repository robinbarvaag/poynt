# reCAPTCHA (Google, v3)

Spamvern på alle offentlige skjemaer. v3 er den usynlige varianten: brukeren
får aldri en «klikk på alle trafikklysene»-oppgave. Nettleseren henter et token
i bakgrunnen, og Google svarer serveren vår med en score mellom 0.0
(sannsynligvis bot) og 1.0 (sannsynligvis menneske). Alt under terskelen blir
avvist.

Badgen nede i høyre hjørne er **skjult** (`.grecaptcha-badge` i
`app/globals.css`). Det er lov så lenge teksten «Beskyttet av reCAPTCHA …» med
lenker til Googles personvernerklæring og vilkår står synlig ved skjemaet — det
er akkurat det `<RecaptchaNotice>` gjør. **Skjuler du badgen uten den teksten,
bryter du Googles vilkår.**

## Hent nøklene

Du trenger to nøkler: én offentlig (site key) som ligger i nettleseren, og én
hemmelig (secret key) som bare serveren ser.

1. Gå til <https://www.google.com/recaptcha/admin/create> og logg inn med
   Google-kontoen som skal eie nøkkelen (bruk gjerne en felles Poynt-konto, ikke
   en privat — nøkkelen skal overleve at folk bytter jobb).
2. Fyll ut:
   - **Label**: `poynt.no`
   - **reCAPTCHA type**: velg **Score based (v3)**.
     Ikke «Challenge (v2)» — da får du en avkrysningsboks i stedet.
   - **Domains**: legg inn ett domene per linje:
     ```
     poynt.no
     www.poynt.no
     localhost
     ```
     `localhost` trengs for at skjemaene skal virke under `bun run dev`.
     Har du preview-deploys på Vercel du vil teste skjemaer på, legg til
     `vercel.app` også (Google matcher på subdomener).
   - Kryss av for vilkårene og trykk **Submit**.
3. Du får nå to nøkler. Kopier begge:
   - **SITE KEY** — offentlig, havner i HTML-en.
   - **SECRET KEY** — hemmelig, skal **aldri** i frontend eller i git.

Nøklene finner du igjen senere under
<https://www.google.com/recaptcha/admin> → velg siden → tannhjulet → «reCAPTCHA
keys».

> Google har to konsoller. `google.com/recaptcha/admin` er den klassiske og
> gratis — den holder i massevis for oss. Blir du dyttet mot «reCAPTCHA
> Enterprise» i Google Cloud, kan du bruke den også, men da er oppsettet et
> annet enn det som er beskrevet her.

## Legg dem inn

### Lokalt (`apps/web/.env.local`)

```bash
# Google reCAPTCHA v3 — se docs/RECAPTCHA.md
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RECAPTCHA_SECRET_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Start dev-serveren på nytt etterpå — `NEXT_PUBLIC_*` bakes inn i bygget og
plukkes ikke opp av en server som allerede kjører.

### Vercel

Settings → Environment Variables → legg inn begge to for **Production**,
**Preview** og **Development**. Deretter en ny deploy (env-variabler slår ikke
gjennom på et allerede bygget deploy).

`NEXT_PUBLIC_RECAPTCHA_SITE_KEY` er *ment* å være offentlig — den ligger i
HTML-en uansett. `RECAPTCHA_SECRET_KEY` skal aldri ha `NEXT_PUBLIC_`-prefiks.

### Valgfritt: terskel

```bash
RECAPTCHA_MIN_SCORE=0.5   # standard. 0.0–1.0
```

Google anbefaler 0.5. Ser du i loggen at ekte folk blir avvist (`[recaptcha]
avvist … low-score`), senk til 0.3. Får du gjennom spam, hev til 0.7.

## Uten nøkler

Mangler `RECAPTCHA_SECRET_KEY`, slipper **alt** gjennom, og `<RecaptchaNotice>`
rendrer ingenting. Det er med vilje: nettstedet skal ikke slutte å ta imot
skjemaer fordi en nøkkel mangler. Rate-limitingen per IP (`lib/rate-limit.ts`)
står igjen som brems uansett.

Det samme skjer hvis Google ikke svarer (nettverksfeil eller timeout på fem
sekunder) — vi logger og slipper gjennom, i stedet for å låse skjemaet.

## Slik henger det sammen

| Fil | Rolle |
| --- | --- |
| `packages/utils/recaptcha.ts` | Serverside-verifisering mot Google. Delt, fordi både Next-rutene, Payload og innloggingen trenger den. |
| `apps/web/lib/recaptcha.ts` | `guardRecaptcha(request, action)` — vakt å legge øverst i en API-rute. |
| `apps/web/components/recaptcha.tsx` | `useRecaptcha(action)`, `recaptchaHeader(token)` og `<RecaptchaNotice>`. |
| `apps/web/app/globals.css` | Skjuler badgen. |

Tokenet sendes som HTTP-header `x-recaptcha-token`, ikke i JSON-kroppen — da
slipper endepunkter som sender kroppen videre til Payload eller Stripe å plukke
ut et ekstra felt.

Scriptet fra Google lastes **først når et skjema vises**, ikke på hver side. En
side uten skjema betaler ingenting.

## Hvilke skjemaer er beskyttet

| Skjema | Handling (`action`) | Serverside |
| --- | --- | --- |
| Alle skjema-blokker fra Payload (kontakt, venteliste, medlemssøknad …) | `kontaktskjema` | `payload.config.ts` → `formSubmissionOverrides.access.create` |
| Nyhetsbrev | `nyhetsbrev` | `/api/newsletter` |
| Nyhetsbrev fra kvitteringssiden | `nyhetsbrev_ordre` | `/api/newsletter/order-opt-in` |
| Påmelding til event | `paamelding` | `/api/eventer/[id]/pamelding` |
| Bokporten (ordrenummer) | `boktilgang` | `/api/book-access` |
| Rabattkode i handlekurven | `rabattkode` | `/api/coupon` |
| Innlogging med magic link | `innlogging` | `hooks.before` i `packages/planner-auth/server.ts` |

Google-innlogging går via OAuth-redirect og trenger ingen sjekk. Skjemaene
inne i On Poynt (verktøy, bedriftsprofil, invitasjoner) krever innlogging og er
holdt utenfor med vilje — reCAPTCHA hører hjemme foran åpne dører.

## Nytt skjema?

1. I komponenten:

   ```tsx
   import { RecaptchaNotice, recaptchaHeader, useRecaptcha } from "@/components/recaptcha";

   const getRecaptchaToken = useRecaptcha("mitt_skjema");

   const token = await getRecaptchaToken();
   await fetch("/api/mitt-endepunkt", {
     method: "POST",
     headers: { "Content-Type": "application/json", ...recaptchaHeader(token) },
     body: JSON.stringify(data),
   });
   ```

   …og `<RecaptchaNotice className="text-muted-foreground" />` nederst i
   skjemaet. Den er ikke valgfri — se øverst.

2. I API-ruta, rett etter rate-limit:

   ```ts
   const blocked = await guardRecaptcha(request, "mitt_skjema");
   if (blocked) return blocked;
   ```

Handlingsnavnet må være det samme begge steder — serveren sjekker at det
stemmer, så et token hentet på nyhetsbrevet ikke kan gjenbrukes mot påmeldingen.
Google godtar bare bokstaver, tall, understrek og skråstrek i navnet: ingen
bindestrek, ingen æøå.

## Feilsøking

| Symptom | Årsak |
| --- | --- |
| `[recaptcha] avvist «x»: invalid-token` med `invalid-input-secret` | Feil eller manglende secret key på serveren. |
| Samme, med `timeout-or-duplicate` | Tokenet er brukt før eller eldre enn to minutter. Skjer hvis brukeren lar skjemaet stå lenge — de kan bare sende på nytt. |
| `… : low-score` på deg selv | Terskelen er for stram, eller du tester fra VPN/Tor. Juster `RECAPTCHA_MIN_SCORE`. |
| `… : missing-token` | Scriptet ble blokkert (annonseblokker) eller domenet står ikke i nøkkelens domeneliste. |
| `[recaptcha] svar uten score — er RECAPTCHA_SECRET_KEY en v3-nøkkel?` | Du har lagt inn en **v2**-nøkkel. Lag en ny nøkkel med typen «Score based (v3)». Alt slipper gjennom i mellomtiden. |
| «ERROR for site owner: Invalid domain for site key» i konsollen | Domenet mangler i nøkkelens domeneliste i Google-konsollen. |
| Badgen vises likevel | `.grecaptcha-badge`-regelen i `app/globals.css` er borte, eller noe overstyrer den med høyere spesifisitet. |
