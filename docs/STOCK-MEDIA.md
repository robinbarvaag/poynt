# Stock-bilder i Payload-admin (Pexels + Giphy)

Lar partneren søke i **Pexels** (gratis foto) og **Giphy** (GIF-er) direkte fra
Payload-admin og importere et bilde med ett klikk. Importerte bilder havner i
`Media`-collection og kan velges i alle bildefelt (hovedbilde, galleri, avatar
osv.) – akkurat som et opplastet bilde.

## Slik bruker partneren det

**Fra et bildefelt (auto-velg):** I et hvilket som helst innhold (blogg, artikkel,
guide, kurs, podkast, tjeneste, produkt) ligger en **«🔍 Finn gratis bilde
(Pexels / Giphy)»**-knapp rett under bildefeltet. Søk, klikk et bilde → det
importeres til Media **og velges automatisk inn i feltet**. Ferdig.

**Fra Media-biblioteket:** Gå til **Innhold → Media** (eller «Opprett ny» på et
media) og klikk **«🔍 Finn bilde (Pexels / Giphy)»**. Importerte bilder legges i
biblioteket og kan velges i alle bildefelt etterpå.

I begge tilfeller: velg kilde (Pexels = foto, Giphy = GIF), søk, klikk et bilde.
Bildet lastes ned og krediteres automatisk.

## Hvorfor Pexels og ikke Unsplash?

Vi laster bildet **ned** og lagrer det i vår egen Media (Vercel Blob), slik at det
blir et helt vanlig Media-dokument som fungerer i alle bildefelt og får
responsive `imageSizes`.

- **Pexels-lisensen tillater dette eksplisitt** (nedlasting, modifisering,
  re-hosting, også kommersielt; attribusjon er ønsket, ikke påkrevd per visning).
- **Unsplash sine API-vilkår (§6) krever derimot _hotlinking_** – at du embedder
  Unsplash sine CDN-URL-er direkte. Da kan bildet ikke bli et Media-dokument, og
  du må vise fotograf-attribusjon hver gang bildet rendres (§9). Det passer dårlig
  med «last opp til Media»-modellen, så vi valgte Pexels.

Vil du likevel bruke Unsplash senere, må det gjøres som hotlinking (lagre URL +
attribusjon som referanse, render attribusjon i frontend), ikke nedlasting.

## API-nøkler (gratis)

Begge tjenestene er gratis. Legg nøklene i `apps/web/.env.local`:

```
PEXELS_API_KEY=...
GIPHY_API_KEY=...
```

- **Pexels** – https://www.pexels.com/api/ → opprett konto → «Your API Key».
  Gratis kvote: 200 forespørsler/time, 20 000/måned. Send gjerne en
  «Photos provided by Pexels»-lenke der bilder vises hvis du vil være ekstra
  ryddig (anbefalt, ikke påkrevd). Fotograf lagres i `creditLine`.
- **Giphy** – https://developers.giphy.com/dashboard → «Create an App» →
  velg «API» (ikke SDK). Giphy ønsker en «Powered by GIPHY»-attribusjon der
  GIF-er vises.

Uten nøkkel gir den aktuelle fanen en tydelig feilmelding; den andre fungerer
fortsatt.

## Hvordan det henger sammen

| Del | Fil |
| --- | --- |
| Søk + import (server-actions, holder nøklene server-side) | `apps/web/admin/actions/stock-media.ts` |
| Delt søkemodal | `apps/web/admin/components/media/stock-picker-modal.tsx` |
| Knapp over Media-lista / i media-skjemaet | `apps/web/admin/components/media/stock-picker.tsx` |
| Auto-velg-knapp under upload-felt (`afterInput`) | `apps/web/admin/components/media/stock-field-button.tsx` |
| Innkobling på upload-felt | `apps/web/fields/stock-picker-after-input.ts` (spres inn i feltets `admin.components`) |
| Krediteringsfelt + knappe-innkobling på Media | `apps/web/collections/media.ts` |
| Kolonner `source` / `credit_line` / `source_url` | `apps/web/migrations/20260628_205846_stock_media_fields.ts` |
| Frontend-kreditering (overlay-badge / caption) | `apps/web/components/media-credit.tsx` |

Bildet kjøres gjennom Payloads vanlige upload-pipeline (sharp + Vercel Blob), så
responsive `imageSizes` lages som ellers.

## Kreditering i frontend (`<MediaCredit>`)

`<MediaCredit media={...} />` viser et diskret kreditt-badge nederst i hjørnet av
bildet (eller en `caption`-linje under), og returnerer `null` for vanlige
opplastede bilder — så den kan trygt strøs på alle bilde-kall. Den er koblet inn
på hero-/featured-bildene på detalj­sidene: blogg, artikler, ressurser, kurs,
podkast og tjenester. Den krever en `position: relative`-forelder (alle
`fill`-bilder har det allerede).

> **Ikke dekket ennå:** produktgalleriet (`apps/web/components/product-detail.tsx`)
> rendrer bilder via `resolveMediaUrl` som rå strenger i en klientkomponent, så
> krediteringen er ikke tredd gjennom der. Produktfoto er normalt partnerens egne
> bilder. Legg til `creditLine`/`sourceUrl` i galleri-dataene hvis dere vil ha
> stock-kreditering også der.

## Merknad om GIF-er

GIF-er fra Giphy lagres i originalformat slik at animasjonen beholdes. Payload
genererer fortsatt `imageSizes` (thumbnail/card/tablet) av dem, men de variantene
blir statiske enkeltbilder – det gjelder bare forhåndsvisninger. Bruk
**original-URL-en** (ikke en størrelse) når en animert GIF skal vises i frontend.
