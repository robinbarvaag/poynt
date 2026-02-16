# Poynt — Veikart

> Sist oppdatert: 2026-02-16

## Ferdig

- Monorepo med Turborepo + Bun
- Next.js 16 + Payload CMS 3.70 + PostgreSQL
- Payload-collections: Users, Products, Orders, Pages, Media, BlogPosts
- Blokk-basert sidebyggar (Hero, Content, Media, Features, Archive, etc.)
- Nettbutikk med handlekurv + Stripe checkout (digitale produkt)
- Better Auth med Google OAuth + magic link
- Drizzle-basert membership-system (planner_subscription)
- Stripe webhook: membership-kjøp, subscription lifecycle, produktordrar
- Velkomst-epost (React Email + Resend)
- Onboarding-flow for nye medlemmer
- Stripe Customer Portal for sjølvbetjening
- Membership-innstillingsside i On Poynt
- On Poynt-portal med sidebar, layout, auth-guards

## Husarbeid

### Flatten `apps/web/src/`
- Flytt `src/blocks/`, `src/collections/`, `src/globals/` opp til `apps/web/`
- Slå saman `src/lib/` inn i `apps/web/lib/`
- Oppdater importar (`@/src/...` → `@/...`)
- Fjern `src/`-mappa

### Rydd opp planleggingsfiler
- Slett `.planning/` og `.plans/` (erstatta av denne fila)
- Oppdater CLAUDE.md (fjern referanse til `.plans/`)

## Innhaldssystem (Community Content)

Artiklar og guider for medlemmer, administrert i Payload.

- Payload-collection: `Articles` med kategoriar (LinkedIn, TikTok, E-post, etc.)
- Rik tekst-editor, bilete, utkast, planlagd publisering
- Artikkelside med TOC for lange innlegg
- Oversiktsside med kategorifilter og søk
- Tilgangskontroll: synleg for alle medlemmer (community + community_ai)

## Podcast-to-Content (AI-verktøy)

Verktøy som tek ein podkast-episode og genererer innhald frå den.

- Last opp lydfil / lim inn URL
- Transkripsjon (Whisper eller tilsvarande)
- Generer blogginnlegg, sosiale medier-postar, kapittelmerke
- Redigerbart resultat før publisering
- Krev `community_ai`-tier

## Admin-verktøy i Payload

Partnaren treng eitt admin-grensesnitt. Bygg custom views i Payload som les frå Drizzle.

### Medlemsadministrasjon
- Liste over alle On Poynt-medlemmer (frå Drizzle planner_user + planner_subscription)
- Vis detaljar: e-post, tier, Stripe-status, siste innlogging
- Endre tier / deaktiver medlemskap

### Prompt-administrasjon
- Rediger standard system-prompts for kvart AI-verktøy
- Per-kunde prompt-overrides for spesifikke medlemmer
- Kan vere Payload-collection (`SystemPrompts`) eller Drizzle-tabell — avheng av kva som gir best UX

### Bransje-konfigurasjon
- Administrer bransjar som AI-verktøya brukar som kontekst
- Legg til / rediger / fjern bransjar

## Tilgangskontroll

- AI-verktøy sjekkar tier før køyring (`community_ai` only)
- `community`-brukarar ser oppgraderingsmelding med pris
- Kansellert abonnement: tilgang til periodens slutt (`cancel_at_period_end`)
- Forfalt betaling: grace period + e-postvarsel

## Lokalisering (lågare prioritet)

- Payload-lokalisering for CMS-innhald (nb + en)
- UI-strings på norsk og engelsk
- Språkbyttar med persistert preferanse
- Bruk locale-kode `nb` (Bokmål), ikkje `no`

## Notat

- Drizzle-migrasjonar: `drizzle-kit generate` → `drizzle-kit migrate` (ALDRI `push`)
- Payload Users = berre admin. Medlemsdata = Drizzle.
- Stripe handterer både produktkjøp (Payload orders) og membership (Drizzle)
- Prismodell: 1m=999kr, 3m=899kr, 6m=849kr, 12m=799kr per månad
