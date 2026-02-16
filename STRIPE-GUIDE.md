# Stripe-guide for Poynt

> Alt du treng for å sette opp og teste Stripe i dette prosjektet.

## Korleis Stripe fungerer (kort)

Stripe handterer betaling for oss. Vi sender aldri kortnummer — Stripe gjer alt det.

**Flyten:**
1. Brukaren klikkar "Kjøp" på nettsida vår
2. Vi lagar ein **Checkout Session** via Stripe API (server-side)
3. Brukaren vert sendt til Stripe si betalingsside (hosted av Stripe)
4. Brukaren betalar → Stripe sender ein **webhook** tilbake til oss
5. Webhook-handleren vår oppdaterer database, sender e-post, etc.

**To typar betaling i Poynt:**
- **Products** (PDF, kurs): Eingongsbetaling (`mode: "payment"`)
- **Membership**: Abonnement som fornyar seg (`mode: "subscription"`)

## 1. Opprett Stripe-konto

1. Gå til [dashboard.stripe.com](https://dashboard.stripe.com) og registrer deg
2. Du startar automatisk i **Test Mode** (ingen ekte pengar)
3. Oppe til høgre ser du ein "Test mode"-bryter — la den stå på

## 2. Finn API-nøklane dine

1. I Stripe Dashboard → **Developers** → **API keys**
2. Du treng to nøklar:
   - **Publishable key**: `pk_test_...` (vi brukar den ikkje direkte no)
   - **Secret key**: `sk_test_...` (denne treng backend)

Legg secret key i `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_din_nøkkel_her
```

## 3. Sett opp produkt for membership

### Steg 1: Lag produktet i Stripe Dashboard

1. **Products** → **Add product**
2. Namn: "On Poynt Community" (eller kva du vil)
3. Ikkje legg til pris her — vi gjer det via kode

### Steg 2: Køyr prisopprettings-scriptet

Prosjektet har eit script som lagar 4 prisar (1, 3, 6, 12 mnd) automatisk:

```bash
# Finn produkt-IDen i Stripe Dashboard (prod_xxxxx)
# Køyr frå apps/web:
cd apps/web
bun run tsx src/lib/stripe/create-membership-prices.ts
```

> Scriptet ligg i `apps/web/src/lib/stripe/create-membership-prices.ts`.
> Du må kanskje redigere det og leggje inn produkt-IDen din.

Scriptet lagar prisar med desse beløpa (i NOK):

| Periode | Per månad | Totalt | Rabatt |
|---------|-----------|--------|--------|
| 1 mnd | 999 kr | 999 kr | — |
| 3 mnd | 899 kr | 2 697 kr | 10% |
| 6 mnd | 849 kr | 5 094 kr | 15% |
| 12 mnd | 799 kr | 9 594 kr | 20% |

### Steg 3: Legg pris-IDane i .env

Etter scriptet køyrer, får du 4 pris-IDar (`price_xxxxx`). Legg dei i `.env.local`:

```
NEXT_PUBLIC_MEMBERSHIP_PRICE_1M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_3M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_6M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_12M=price_xxxxx
```

No veit `/medlemskap`-sida kva prisar som skal brukast.

## 4. Produkt (digitale produkt) — dette skjer automatisk

Når du lagar eit produkt i Payload admin:
1. Payload sin Stripe-plugin lagar automatisk eit Stripe-produkt
2. Når du set ein pris (i øre) på produktet, lagar ein afterChange-hook automatisk ein Stripe-pris
3. Alt vert lagra på produktet (`stripeID`, `stripePriceId`)

Du treng ikkje gjere noko manuelt for digitale produkt.

## 5. Sett opp webhooks (lokal testing)

Webhooks er korleis Stripe fortel oss at "nokon har betalt". Utan dette skjer ingenting etter betaling.

### Installer Stripe CLI

```bash
# Windows (med scoop)
scoop install stripe

# Eller last ned frå: https://stripe.com/docs/stripe-cli
```

### Logg inn

```bash
stripe login
```

Opnar nettlesaren → godkjenn tilgang.

### Start webhook-forwarding

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Du får ein **webhook signing secret**: `whsec_xxxxx`. Legg den i `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

> **Viktig:** Denne nøkkelen endrar seg kvar gong du køyrer `stripe listen`. Du må oppdatere `.env.local` og restarte dev-serveren.

### Alle .env-variablar oppsummert

```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_1M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_3M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_6M=price_xxxxx
NEXT_PUBLIC_MEMBERSHIP_PRICE_12M=price_xxxxx
```

## 6. Testing — steg for steg

### Start alt

Du treng **to terminalvindauge**:

```bash
# Terminal 1: Dev-server
bun run dev

# Terminal 2: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Testkort

Stripe har testkort som simulerer ulike scenario:

| Kort | Resultat |
|------|----------|
| `4242 4242 4242 4242` | Betaling godkjent |
| `4000 0000 0000 3220` | Krev 3D Secure (ekstra steg) |
| `4000 0000 0000 9995` | Betaling avvist |
| `4000 0000 0000 0341` | Betaling feiler ved capture |

For alle testkort:
- **Utløpsdato:** kva som helst i framtida (t.d. 12/30)
- **CVC:** kva som helst 3 siffer (t.d. 123)
- **Postnummer:** kva som helst (t.d. 0000)

### Test A: Kjøp eit digitalt produkt

1. Gå til `http://localhost:3000/produkter`
2. Vel eit produkt → "Legg i handlekurv"
3. Gå til `/handlekurv` → "Gå til kassen"
4. Du vert sendt til Stripe Checkout
5. Bruk testkort `4242 4242 4242 4242`
6. Du kjem tilbake til `/kvittering`

**Sjekk at det fungerte:**
- Terminal 2 viser `checkout.session.completed` event
- Payload admin → Orders → ny ordre synleg
- E-post sendt (sjekk Resend dashboard)

### Test B: Kjøp membership

1. Gå til `http://localhost:3000/medlemskap`
2. Vel faktureringsperiode → "Bli medlem"
3. Bruk testkort `4242 4242 4242 4242`
4. Du kjem tilbake til `/medlemskap/bekreftelse`

**Sjekk at det fungerte:**
- Terminal 2 viser `checkout.session.completed` + `customer.subscription.created`
- DB: `planner_user` oppretta (om ny brukar)
- DB: `planner_subscription` med tier=community, status=active
- Velkomstepost sendt

### Test C: Logg inn og sjå membership

1. Gå til `/on-poynt/innlogging`
2. Logg inn med same e-post som du brukte i Stripe
3. Om `onboardingCompleted=false` → onboarding-flow
4. Gå til `/on-poynt/innstillinger/medlemskap`
5. Skal vise "Community" med grøn "Aktiv"-badge

### Test D: Kanseller via Customer Portal

1. På medlemskapssida → "Administrer abonnement"
2. Stripe Customer Portal opnar seg
3. Klikk "Cancel plan"
4. Terminal 2 viser `customer.subscription.updated`
5. Tilbake i appen: status oppdatert

### Test E: Simuler mislukka betaling

```bash
# I ein tredje terminal:
stripe trigger invoice.payment_failed
```

Sjekk at `planner_subscription.status` vert `past_due` i databasen.

### Test F: Simuler fornying

```bash
stripe trigger invoice.paid
```

Sjekk at status vert tilbake til `active`.

## 7. Stripe Customer Portal setup

Portalen let brukarar sjølv administrere abonnementet sitt (kansellere, endre betalingsmiddel).

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. Slå på:
   - "Customers can update their payment methods" ✅
   - "Customers can cancel subscriptions" ✅
   - Set cancellation til "Cancel at end of billing period" (ikkje umiddelbart)
3. Legg til ein lenke tilbake: `http://localhost:3000/on-poynt/innstillinger/medlemskap`

## 8. Frå test til produksjon

Når alt fungerer i test-modus:

1. **Stripe Dashboard** → Slå av "Test mode"
2. Hent **live** API-nøklar (starter med `sk_live_` og `pk_live_`)
3. Opprett membership-prisane på nytt (live-produkt)
4. Sett opp **live webhook** i Stripe Dashboard:
   - **Settings** → **Webhooks** → **Add endpoint**
   - URL: `https://ditt-domene.no/api/webhooks/stripe`
   - Events å lytte på:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
5. Oppdater alle env-variablar i hosting-miljøet med live-verdiar

> I produksjon treng du IKKJE Stripe CLI — webhooks kjem direkte frå Stripe til din URL.

## Nyttige Stripe Dashboard-sider

- **Payments**: Sjå alle betalingar (test og live)
- **Subscriptions**: Sjå aktive abonnement
- **Customers**: Sjå kundar og deira betalingshistorikk
- **Webhooks** (under Developers): Sjå kva events som er sendt + eventuelle feil
- **Logs** (under Developers): Sjå alle API-kall — nyttig for debugging

## Feilsøking

**"Webhook signature verification failed"**
→ `STRIPE_WEBHOOK_SECRET` i `.env.local` stemmer ikkje. Køyr `stripe listen` på nytt og oppdater.

**"No such price: price_xxxxx"**
→ Pris-IDen i env er feil eller finst ikkje i test-modus. Sjekk Stripe Dashboard → Products.

**Webhook kjem ikkje**
→ Er `stripe listen` køyrande? Sjekk at den viser "Ready!"

**"Customer not found" i Customer Portal**
→ Brukaren har ikkje ein `stripeCustomerId` i `planner_subscription`. Skjer om webhook ikkje vart prosessert.

**Betaling godkjent men ingen ordre/subscription i DB**
→ Sjekk Terminal 2 for feilmeldingar. Sjekk Stripe Dashboard → Webhooks → sjå event-historikk og response.
