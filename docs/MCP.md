# MCP-server — bygg sider med Claude

Appen eksponerer en [MCP](https://modelcontextprotocol.io)-server som lar Claude
(claude.ai, Claude Desktop, Claude Code) bygge sider i Payload på vegne av
redaktøren. Susanne beskriver hva hun vil ha («lag en landingsside for
AI-foredraget mitt»), Claude slår opp hvilke blokker som finnes, følger tone of
voice og komposisjonsreglene, og oppretter et **utkast**. Hun får admin-lenken,
justerer og publiserer selv.

## Sikkerhet

- **Alt lagres som utkast.** Serveren setter alltid `_status: draft` og bruker
  `draft: true`. Den publiserte versjonen av en side røres aldri, og
  publisering skjer kun av et menneske i admin.
- **Ett unntak:** `update_media_alt` endrer alt-teksten på et bilde direkte,
  fordi Media ikke har utkast. Det er ikke-destruktivt (tidligere verdi
  returneres), og Claude er instruert om å få ja først.
- **Ingen sletting.** Det finnes ikke noe verktøy for å slette sider, media
  eller noe annet.
- **Delt hemmelighet** i `MCP_SECRET` (minst 16 tegn; lag med
  `openssl rand -hex 24`). Uten den er endepunktet avslått. Hemmeligheten er en
  del av URL-en fordi claude.ai-connectorer ikke kan sende egne headere.
  Klienter som kan det (Claude Code) kan i stedet sende
  `Authorization: Bearer <MCP_SECRET>`.
- Serveren bruker Payloads lokale API, så validering, versjoner og
  cache-revalidering skjer akkurat som ved lagring i admin — ingen direkte
  databasetilgang.

Lekker hemmeligheten: bytt `MCP_SECRET` i Vercel og oppdater connectoren.

## Koble til

Endepunkt: `https://<domene>/api/mcp/<MCP_SECRET>` (Streamable HTTP).

**claude.ai / Claude Desktop:** Innstillinger → Connectors → «Add custom
connector». Velg «No sign-in». Anbefalt: URL `https://<domene>/api/mcp/claude`
(siste ledd er vilkårlig) og en request header `Authorization` med verdi
`Bearer <MCP_SECRET>` — da lagres hemmeligheten skjult. Alternativt legges
hemmeligheten i URL-en uten header. Deretter er verktøyene tilgjengelige i alle
samtaler (og kan slås av per samtale).

**Claude Code:**

```bash
claude mcp add --transport http poynt-cms https://<domene>/api/mcp/<MCP_SECRET>
```

**Lokalt:** legg `MCP_SECRET=…` i `apps/web/.env.local` og bruk
`http://localhost:3000/api/mcp/<MCP_SECRET>`.

## Verktøy

| Verktøy | Gjør |
| --- | --- |
| `get_guidelines` | Tone of voice (`lib/tone-of-voice.ts`) + komposisjonsregler. Claude bes lese denne først. |
| `list_blocks` | Alle blokker i `layoutBlocks` med norsk navn, beskrivelse og feltnavn. |
| `get_block_schema` | Fullt felt-skjema for én blokk: labels, beskrivelser, påkrevd, select-valg, underfelt. |
| `list_pages` | Eksisterende sider (tittel, slug, status, blokk-rekkefølge, admin-lenke). |
| `get_page` | Én side i MCP-format — kan brukes rett som mal. |
| `check_layout` | Validerer uten å lagre: ukjente blokker, manglende påkrevde felt, komposisjonsregler. |
| `create_page_draft` | Oppretter ny side som utkast. Returnerer admin-lenke + komposisjonsfunn. |
| `update_page_draft` | Nytt utkast på eksisterende side (publisert versjon urørt). |
| `create_case_study_draft` | Kundehistorie som utkast: tittel, kunde, historie (markdown), resultater i tall, sitat, hovedbilde. |
| `create_blog_post_draft` | Blogginnlegg som utkast: tittel, ingress, innhold (markdown), hovedbilde, kategorier. |
| `list_categories` | Bloggkategorier → ID. |
| `search_media` | Finn bilder (alt/filnavn) → media-ID til bildefelt. |
| `upload_media_from_url` | Henter et bilde fra en offentlig direktelenke inn i mediebiblioteket (maks 40 MB, kun `image/*`, interne adresser avvist). |
| `list_related` | Produkter, tjenester, skjemaer og kategorier → ID til relationship-felt. |
| `get_product` | Hele produktet: type, pris, førpris, MVA, beskrivelser (markdown), varianter, medlemskapsinnstillinger. For å lese/vurdere det som selges. |
| `list_blog_posts` / `list_case_studies` | Eksisterende innlegg/kundehistorier (også utkast) med status og om SEO-feltene er fylt ut. |
| `get_blog_post` / `get_case_study` | Hele dokumentet som markdown + SEO-felt. `contentNotInMarkdown` lister det markdown ikke gjengir (bilder, nummererte lister). Produktkort kommer som `[produktkort id=…]`-linjer. |
| `update_blog_post_draft` / `update_case_study_draft` | Nytt utkast på eksisterende innlegg/kundehistorie. `contentEdits` (finn/erstatt i Lexical) bevarer alt; `content` erstatter hele teksten og nektes hvis noe da går tapt, med mindre `allowContentLoss`. Slug endres ikke (krever omdirigering). |
| `get_seo_guidelines` | SEO-reglene: meta-tittel/-beskrivelse, delingsbilde, alt-tekst, struktur, arbeidsflyt. |
| `seo_audit` | SEO-revisjon av sider, blogg, kundehistorier, tjenester, produkter og forsiden: lengder slik de faktisk vises (med fallback), delingsbilde, alt-tekst, noindex/canonical, struktur, duplikater. |
| `get_seo` | SEO for ett dokument: råfelt, Google-forhåndsvisning, hvilket delingsbilde som brukes og hvorfor. |
| `update_seo_draft` | Meta-tittel/-beskrivelse/-bilde, noindex, canonical og FAQ som utkast (sider, blogg, kundehistorier, tjenester). Produkter og forsiden har ikke utkast og endres i admin. |
| `check_live_seo` | Leser `<head>` på den publiserte siden (kun eget domene): title, description, canonical, robots, OG, Twitter, H1, JSON-LD — og laster og:image (status, type, størrelse). |
| `update_media_alt` | Setter alt-tekst på et bilde. **Gjelder med en gang** (media har ikke utkast) — Claude skal få ja først. |
| `list_events` | Alle eventer (også utkast) med dato, status, påmeldingsmodus og plasser tatt. |
| `get_event` | Ett event: tider, sted, tekster som markdown, program, FAQ og påmeldingsoppsett. Ingen personopplysninger om påmeldte. |
| `create_event_draft` | Nytt event som utkast (`lib/mcp/tools-events.ts`): tekster som markdown, datoer med tidssone, program, FAQ, plasser, følge og ekstra spørsmål. Pris og publisering gjøres i admin. |

**Bilder fra chatten** kan Claude ikke laste opp via MCP. Flyten er: Susanne
laster opp i admin (Media, dra og slipp) eller deler en direktelenke, så
finner Claude bildet med `search_media` eller henter det med
`upload_media_from_url`.

Blokk-skjemaene genereres **automatisk** fra blokk-configene i `apps/web/blocks/`
(`lib/mcp/block-schema.ts`). Ny blokk i `layoutBlocks` dukker opp for Claude
uten videre — gode `label` og `admin.description` på feltene er det som gjør
at Claude fyller dem riktig.

## MCP-format vs. Payload-format

Layouten Claude sender og får er identisk med Payloads, med ett unntak:
**richText-felter er markdown-strenger** (avsnitt, `##`/`###`, `- lister`,
`> sitat`). `lib/mcp/layout-convert.ts` oversetter begge veier, så
`get_page` → rediger → `update_page_draft` er en trygg rundtur. Inline-
formatering (fet, lenker) blir ren tekst — det finpusses i admin.

I blogginnlegg og kundehistorier kan en linje for seg selv være et
**produktkort**: `[produktkort id=12 etikett="Anbefalt" tekst="…" kjøpsknapp=nei]`
(bare `id` påkrevd). Det blir en ekte «Produktkort»-blokk, og `get_*` gir den
samme linjen tilbake. Verktøyene avviser ID-er som ikke er aktive produkter.
Sideblokker bruker i stedet `productSpotlight`-blokken.

Komposisjonsreglene (`lib/composition-rules.ts`) er de samme som Sidesjekk-
panelet i admin bruker. Ny regel der gjelder begge steder.

## Filer

- `apps/web/app/api/mcp/[secret]/route.ts` — auth + HTTP-inngang
- `apps/web/lib/mcp/server.ts` — verktøyene og systeminstruksen
- `apps/web/lib/mcp/block-schema.ts` — Payload-blokk → lesbart skjema
- `apps/web/lib/mcp/layout-convert.ts` / `lexical-markdown.ts` — markdown ↔ Lexical
- `apps/web/lib/composition-rules.ts` — delte komposisjonsregler

## Ideer videre

- Forside (`homepage`-globalen) og andre innholdstyper (tjenester, guider).
- Eget verktøy som kaller `/api/ai/quality-review` for AI-vurdering av utkastet.
- OAuth i stedet for delt hemmelighet hvis flere skal ha tilgang.
