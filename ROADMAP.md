# Poynt — Veikart

> Sist oppdatert: 2026-02-21

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
- Medlemsadministrasjon i Payload admin (custom views med Drizzle-data)
- Innhaldssystem: Articles-collection, oversiktsside med kategorifilter + søk, artikkelside med TOC
- Vis detaljar: e-post, tier, Stripe-status, siste innlogging
- Liste over alle On Poynt-medlemmer (frå Drizzle planner_user + planner_subscription)
- Endre tier / deaktiver medlemskap
- **Tilgangskontroll**: `community_ai`-sjekk på alle AI-verktøy (tRPC + TierGate UI), kansellert-innen-periode-fix, past_due grace period
- **Podcast-to-Content**: lydfil-opplasting → Whisper-transkripsjon → blogginnlegg + sosiale postar + kapittelmerke (`/verktoy/podcast-til-innhald`)
- **Admin-verktøy**: Bransje-konfigurasjon og Prompt-malar i Payload admin (`/admin/bransjar`, `/admin/prompts`)

## Tilgangskontroll (gjenstår)

- Forfalt betaling: e-postvarsel til brukar ved `past_due` (grace period er implementert, men ingen e-post enno)
- Per-kunde prompt-overrides for spesifikke medlemmer (ikkje prioritert)

## Lokalisering (lågare prioritet)

- Payload-lokalisering for CMS-innhald (nb + en)
- UI-strings på norsk og engelsk
- Språkbyttar med persistert preferanse
- Bruk locale-kode `nb` (Bokmål), ikkje `no`

## Notat

- Drizzle-migrasjonar: `drizzle-kit generate` → `bun run db:migrate` frå packages/planner-db (ALDRI `push`)
- Payload Users = berre admin. Medlemsdata = Drizzle.
- Stripe handterer både produktkjøp (Payload orders) og membership (Drizzle)
- Prismodell: 1m=999kr, 3m=899kr, 6m=849kr, 12m=799kr per månad
