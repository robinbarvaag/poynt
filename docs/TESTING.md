# Testscenario — Poynt

> Manuell testing av alt som er bygd til no. Køyr `bun run dev` først.

## 1. Dev-server startar

- [x] `bun run dev` startar utan feil
- [x] `http://localhost:3000` viser framsida
- [x] `http://localhost:3000/admin` viser Payload admin login

## 2. Payload Admin

- [x] Logg inn med admin-brukar
- [x] Users-collection viser berre admin-brukarar (ingen membership-felt synleg)
- [x] Kan opprette/redigere Products, Pages, BlogPosts, Media
- [x] Blokk-basert sidebyggar fungerer (legg til Hero, Content, etc.)

## 3. Offentlege sider

- [x] `/produkter` — viser produktliste
- [x] `/produkter/[slug]` — viser produktdetalj med "Legg i handlekurv" (digitale) eller "Bli medlem" (medlemskap)
- [x] `/handlekurv` — handlekurv fungerer (legg til, fjern, tal oppdaterer seg)
- [x] `/blogg` — viser blogginnlegg
- [x] `/post/[slug]` — viser enkeltinnlegg
- [x] Dynamiske sider (`/om-oss` e.l.) rendrar blokker frå Payload

## 4. Produktkjøp (Stripe)

> Krev Stripe test-modus + webhook forwarding (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

- [x] Legg produkt i handlekurv → Gå til kassen → Stripe Checkout opnar seg
- [x] Bruk testkort `4242 4242 4242 4242` → Betaling godkjent
- [x] Omdirigert til `/kvittering` med ordredetaljar
- [x] Sjekk Payload admin: ny ordre oppretta med rett produkt og Stripe-referanse
- [x] Stadfestingsepost motteke (sjekk Resend dashboard)

## 5. Medlemskapskjøp (Stripe)

> Medlemskap er eit produkt i Payload med type=membership. Prisen vert sett i kr.

- [x] `/produkter` → finn medlemskapsprodukt → klikk "Bli medlem"
- [x] Stripe Checkout opnar seg i subscription-modus
- [x] Bruk testkort `4242 4242 4242 4242` → Betaling godkjent
- [x] Omdirigert til `/kvittering`
- [x] Webhook logg viser: `checkout.session.completed` + `customer.subscription.created`
- [x] Sjekk Drizzle DB: `planner_user` oppretta, `planner_subscription` med tier=community, status=active
- [x] Velkomstepost motteke

## 6. Innlogging & Auth

- [x] `/on-poynt/innlogging` — viser Google OAuth-knapp + magic link-skjema
- [x] Google OAuth: klikk → Google consent → omdirigert tilbake, innlogga
- [x] Magic link: skriv e-post → "Sjekk e-posten din" → klikk lenke i e-post → innlogga
- [x] Uautentisert brukar på `/on-poynt/oversikt` → omdirigert til `/on-poynt/innlogging`

## 7. Onboarding

> Krev innlogga brukar med aktivt membership og `onboardingCompleted=false`

- [x] Innlogga brukar med membership → omdirigert til `/on-poynt/onboarding`
- [x] Steg 1: Workspace-oppsett (namn)
- [x] Steg 2: Feature-tour (4 kort)
- [x] Steg 3: Ferdig → klikk "Gå til dashboard"
- [x] `POST /api/onboarding/complete` køyrt → `onboardingCompleted=true` i DB
- [x] Ved neste besøk: rett til dashboard, ikkje onboarding

## 8. On Poynt Dashboard & Verktøy

- [x] `/on-poynt/oversikt` — dashboard med hurtighandlingar
- [x] Sidebar-navigasjon fungerer (verktøy, innstillingar)
- [x] `/on-poynt/verktoy/kanalveileder` — kanalveileder lastar
- [x] `/on-poynt/verktoy/markedsplan` — markedsplan lastar
- [x] `/on-poynt/verktoy/avslag-generator` — avslag-generator lastar
- [x] `/on-poynt/verktoy/arsplanlegger` — årsplanleggar lastar

## 9. Innstillingar

### Workspace
- [x] `/on-poynt/innstillinger/arbeidsomrade` — viser workspace-info
- [x] Kan endre workspace-namn

### Medlemskap
- [x] `/on-poynt/innstillinger/medlemskap` — viser rett tier og status frå Drizzle
- [x] Viser "Community" eller "Community + AI" med grøn "Aktiv"-badge
- [x] "Administrer abonnement"-knapp → opnar Stripe Customer Portal
- [x] Brukar utan membership: viser "Du har ikkje eit aktivt medlemskap" + lenke til produktsida

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
