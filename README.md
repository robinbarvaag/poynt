# Poynt

E-læringsplattform med nettbutikk og medlemsportal. Bun-monorepo bygget med Next.js 16, Payload CMS og Better Auth.

## Stack

- **Next.js 16** (App Router, React 19)
- **Payload CMS 3.70** + PostgreSQL — innhold, admin og produktsalg
- **Better Auth + Drizzle** — kundeautentisering, medlemskap og portal
- **Stripe** — betaling (synket med Payload)
- **Zustand** — handlekurv (localStorage)
- **Turborepo** + **Bun** — bygg og orkestrering
- **Biome** — linting og formattering
- **Tailwind CSS v4** + **Radix UI** — design og komponenter

## Kom i gang

```bash
bun install
bun run dev          # Starter alle tjenester (Turborepo)
```

## Vanlige kommandoer

```bash
bun run dev          # Utvikling
bun run build        # Produksjonsbygg
bun run check        # Biome lint + format (med fixes)
bun run lint         # Biome lint
bun run typecheck    # TypeScript-validering
bun run clean        # Rydd byggeartefakter
bun run nuke         # Full reset (node_modules + reinstall)
```

Fra `apps/web`:

```bash
bun run generate:types   # Regenerer Payload-typer
bun run payload          # Payload CLI
```

## Struktur

```
apps/web/                 # Next.js + Payload-app
packages/
  cart/                   # Zustand handlekurv
  email/                  # Resend e-post
  stripe/                 # Stripe SDK-wrapper
  types/                  # Delte TypeScript-typer
  ui/                     # Radix UI + Tailwind-komponenter
  planner-*/              # Better Auth, Drizzle DB, API, validators
tooling/                  # Tailwind- og TypeScript-presets
docs/                     # Prosjektdokumentasjon (se under)
```

## Dokumentasjon

- [docs/DESIGN.md](docs/DESIGN.md) — designprinsipper og visuell retning («Leken Profesjonalitet»)
- [docs/DESIGN-PLAN.md](docs/DESIGN-PLAN.md) — signatur, scroll-«reise» og bevegelses-/animasjonsplan
- [docs/COMPOSITION.md](docs/COMPOSITION.md) — hvordan det visuelle systemet går igjen i hele appen (via blokkene)
- [docs/STRIPE-GUIDE.md](docs/STRIPE-GUIDE.md) — Stripe-integrasjon, webhooks og medlemskap
- [docs/DRIZZLE-GUIDE.md](docs/DRIZZLE-GUIDE.md) — Drizzle ORM og medlemssystem
- [docs/TESTING.md](docs/TESTING.md) — manuell testsjekkliste
- [ROADMAP.md](ROADMAP.md) — veikart og status
- [CLAUDE.md](CLAUDE.md) — retningslinjer for Claude Code / AI-assistanse

## Arkitektur i korthet

To uavhengige datasystemer uten bru mellom seg:

- **Payload CMS + PostgreSQL** — innhold og admin (partners verktøy). `Users`-collection er kun for admin.
- **Better Auth + Drizzle** — all kunde-/medlemsdata, auth (Google OAuth + magic link), abonnement. Tabeller med `planner_*`-prefiks.

Se [docs/](docs/) for detaljer.
