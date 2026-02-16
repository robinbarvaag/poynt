# Testscenario — Poynt

> Manuell testing av alt som er bygd til no. Køyr `bun run dev` først.

## 1. Dev-server startar

- [ ] `bun run dev` startar utan feil
- [ ] `http://localhost:3000` viser framsida
- [ ] `http://localhost:3000/admin` viser Payload admin login

## 2. Payload Admin

- [ ] Logg inn med admin-brukar
- [ ] Users-collection viser berre admin-brukarar (ingen membership-felt synleg)
- [ ] Kan opprette/redigere Products, Pages, BlogPosts, Media
- [ ] Blokk-basert sidebyggar fungerer (legg til Hero, Content, etc.)

## 3. Offentlege sider

- [ ] `/produkter` — viser produktliste
- [ ] `/produkter/[slug]` — viser produktdetalj med "Legg i handlekurv"
- [ ] `/handlekurv` — handlekurv fungerer (legg til, fjern, tal oppdaterer seg)
- [ ] `/blogg` — viser blogginnlegg
- [ ] `/post/[slug]` — viser enkeltinnlegg
- [ ] `/medlemskap` — viser prisingsida med 4 faktureringsperiodar (1, 3, 6, 12 mnd)
- [ ] Dynamiske sider (`/om-oss` e.l.) rendrar blokker frå Payload

## 4. Produktkjøp (Stripe)

> Krev Stripe test-modus + webhook forwarding (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

- [ ] Legg produkt i handlekurv → Gå til kassen → Stripe Checkout opnar seg
- [ ] Bruk testkort `4242 4242 4242 4242` → Betaling godkjent
- [ ] Omdirigert til `/kvittering` med ordredetaljar
- [ ] Sjekk Payload admin: ny ordre oppretta med rett produkt og Stripe-referanse
- [ ] Stadfestingsepost motteke (sjekk Resend dashboard)

## 5. Medlemskapskjøp (Stripe)

> Krev at Stripe-produkt for membership er sett opp med rette price IDs i .env

- [ ] `/medlemskap` → vel "Community" → vel faktureringsperiode → "Bli medlem"
- [ ] Stripe Checkout opnar seg i subscription-modus
- [ ] Bruk testkort → Betaling godkjent
- [ ] Omdirigert til `/medlemskap/bekreftelse`
- [ ] Webhook logg viser: `checkout.session.completed` + `customer.subscription.created`
- [ ] Sjekk Drizzle DB: `planner_user` oppretta, `planner_subscription` med tier=community, status=active
- [ ] Velkomstepost motteke

## 6. Innlogging & Auth

- [ ] `/on-poynt/innlogging` — viser Google OAuth-knapp + magic link-skjema
- [ ] Google OAuth: klikk → Google consent → omdirigert tilbake, innlogga
- [ ] Magic link: skriv e-post → "Sjekk e-posten din" → klikk lenke i e-post → innlogga
- [ ] Uautentisert brukar på `/on-poynt/oversikt` → omdirigert til `/on-poynt/innlogging`

## 7. Onboarding

> Krev innlogga brukar med aktivt membership og `onboardingCompleted=false`

- [ ] Innlogga brukar med membership → omdirigert til `/on-poynt/onboarding`
- [ ] Steg 1: Workspace-oppsett (namn)
- [ ] Steg 2: Feature-tour (4 kort)
- [ ] Steg 3: Ferdig → klikk "Gå til dashboard"
- [ ] `POST /api/onboarding/complete` køyrt → `onboardingCompleted=true` i DB
- [ ] Ved neste besøk: rett til dashboard, ikkje onboarding

## 8. On Poynt Dashboard & Verktøy

- [ ] `/on-poynt/oversikt` — dashboard med hurtighandlingar
- [ ] Sidebar-navigasjon fungerer (verktøy, innstillingar)
- [ ] `/on-poynt/verktoy/kanalveileder` — kanalveileder lastar
- [ ] `/on-poynt/verktoy/markedsplan` — markedsplan lastar
- [ ] `/on-poynt/verktoy/avslag-generator` — avslag-generator lastar
- [ ] `/on-poynt/verktoy/arsplanlegger` — årsplanleggar lastar

## 9. Innstillingar

### Workspace
- [ ] `/on-poynt/innstillinger/arbeidsomrade` — viser workspace-info
- [ ] Kan endre workspace-namn

### Medlemskap
- [ ] `/on-poynt/innstillinger/medlemskap` — viser rett tier og status frå Drizzle
- [ ] Viser "Community" eller "Community + AI" med grøn "Aktiv"-badge
- [ ] "Administrer abonnement"-knapp → opnar Stripe Customer Portal
- [ ] Brukar utan membership: viser "Du har ikkje eit aktivt medlemskap" + lenke til prissida

## 10. Stripe Customer Portal

> Krev at Customer Portal er konfigurert i Stripe Dashboard

- [ ] `POST /api/customer-portal` → returnerer Stripe portal-URL
- [ ] Brukar kan sjå fakturadetaljar
- [ ] Brukar kan kansellere abonnement
- [ ] Etter kansellering: webhook `customer.subscription.updated` → status oppdatert i Drizzle

## 11. Subscription Lifecycle (Webhooks)

> Test med Stripe CLI: `stripe trigger [event]`

- [ ] `stripe trigger customer.subscription.updated` → tier/status oppdatert i Drizzle
- [ ] `stripe trigger customer.subscription.deleted` → tier=none, status=canceled
- [ ] `stripe trigger invoice.paid` → status=active
- [ ] `stripe trigger invoice.payment_failed` → status=past_due
- [ ] Idempotens: same event sendt to gonger → ingen duplikat, ingen feil

## 12. TypeScript & Lint

- [ ] `bun run typecheck` — ingen feil (relatert til våre endringar)
- [ ] `bun run check` — Biome godkjenner formatering
