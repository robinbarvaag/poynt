# Stripe-guide for Poynt

> Alt du treng for å sette opp og teste Stripe i dette prosjektet.

## Korleis Stripe fungerer (kort)

Stripe handterer betaling for oss. Vi sender aldri kortnummer — Stripe gjer alt det.

**Flyten:**
1. Brukaren klikkar "Kjøp" / "Bli medlem" på nettsida vår
2. Vi lagar ein **Checkout Session** via Stripe API (server-side)
3. Brukaren vert sendt til Stripe si betalingsside (hosted av Stripe)
4. Brukaren betalar → Stripe sender ein **webhook** tilbake til oss
5. Webhook-handleren vår oppdaterer database, sender e-post, etc.

**To typar betaling i Poynt:**
- **Digitale produkt** (PDF, kurs, bundle): Eingongsbetaling (`mode: "payment"`)
- **Medlemskap**: Abonnement som fornyar seg (`mode: "subscription"`)

Begge typane er produkt i Payload — ingen separate sider eller API-ruter.

## 1. Opprett Stripe-konto

1. Gå til [dashboard.stripe.com](https://dashboard.stripe.com) og registrer deg
2. Du startar automatisk i **Test Mode** (ingen ekte pengar)
3. Oppe til høgre ser du ein "Test mode"-bryter — la den stå på

## 2. Finn API-nøklane dine

1. I Stripe Dashboard → **Developers** → **API keys**
2. Du treng:
   - **Secret key**: `sk_test_...` (denne treng backend)

Legg secret key i `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_din_nøkkel_her
```

## 3. Produkt — alt skjer via Payload admin

Alle produkt (digitale + medlemskap) vert oppretta i Payload admin under **Butikk → Produkter**.

### Digitale produkt (kurs, PDF, bundle)

1. Lag eit produkt i Payload admin
2. Payload sin Stripe-plugin lagar automatisk eit Stripe-produkt (`stripeID`)
3. Set pris i kr — prisen vert multiplisert med 100 og sendt til Stripe ved checkout (ingen lagra Stripe-pris)

Du treng ikkje gjere noko manuelt i Stripe Dashboard.

### Medlemskap

1. Lag eit produkt i Payload admin med **Produkttype = Medlemskap**
2. Set **Faktureringsintervall** (t.d. 1 = månadleg, 12 = årleg)
3. Set **Medlemskapsnivå** (Community eller Community + AI)
4. Set **Pris** i kr (t.d. 999 for 999 kr/mnd)

> For ulike prisperiodar (1 mnd, 3 mnd, 12 mnd) opprettar du eitt produkt per periode i Payload.

### Checkout-flyt

- **Digitale produkt**: Brukar legg i handlekurv → går til kassen → Stripe Checkout (`mode: "payment"`)
- **Medlemskap**: Brukar klikkar "Bli medlem" direkte → Stripe Checkout (`mode: "subscription"`)
- Medlemskap kan ikkje blandast med andre produkt i same checkout

Alt går via éin checkout-rute: `/api/checkout`

## 4. Sett opp webhooks (lokal testing)

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
```

## 5. Testing — steg for steg

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
- Payload admin → Orders → ny ordre med kundens e-post og namn
- E-post sendt (sjekk Resend dashboard)

### Test B: Kjøp medlemskap

1. Gå til `http://localhost:3000/produkter`
2. Finn eit medlemskapsprodukt → klikk "Bli medlem"
3. Bruk testkort `4242 4242 4242 4242`
4. Du kjem tilbake til `/kvittering`

**Sjekk at det fungerte:**
- Terminal 2 viser `checkout.session.completed` + `customer.subscription.created`
- DB: `planner_user` oppretta (om ny brukar)
- DB: `planner_subscription` med rett tier og status=active
- Velkomstepost sendt

### Test C: Logg inn og sjå membership

1. Gå til `/on-poynt/innlogging`
2. Logg inn med same e-post som du brukte i Stripe
3. Om `onboardingCompleted=false` → onboarding-flow
4. Gå til `/on-poynt/innstillinger/medlemskap`
5. Skal vise rett tier med grøn "Aktiv"-badge

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

## 6. Stripe Customer Portal setup

Portalen let brukarar sjølv administrere abonnementet sitt (kansellere, endre betalingsmiddel).

1. Stripe Dashboard → **Settings** → **Billing** → **Customer portal**
2. Slå på:
   - "Customers can update their payment methods"
   - "Customers can cancel subscriptions"
   - Set cancellation til "Cancel at end of billing period" (ikkje umiddelbart)
3. Legg til ein lenke tilbake: `http://localhost:3000/on-poynt/innstillinger/medlemskap`

## 7. Frå test til produksjon

Når alt fungerer i test-modus:

1. **Stripe Dashboard** → Slå av "Test mode"
2. Hent **live** API-nøklar (starter med `sk_live_`)
3. Opprett produkt (inkl. medlemskap) på nytt i Payload admin — dei syncar automatisk til live Stripe
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

**"Produkt manglar Stripe-kopling"**
→ Produktet har ikkje `stripeID`. Opne produktet i Payload admin og lagre det på nytt — Stripe-pluginen opprettar produktet automatisk.

**Webhook kjem ikkje**
→ Er `stripe listen` køyrande? Sjekk at den viser "Ready!"

**"Customer not found" i Customer Portal**
→ Brukaren har ikkje ein `stripeCustomerId` i `planner_subscription`. Skjer om webhook ikkje vart prosessert.

**Betaling godkjent men ingen ordre/subscription i DB**
→ Sjekk Terminal 2 for feilmeldingar. Sjekk Stripe Dashboard → Webhooks → sjå event-historikk og response.

**Medlemskap-produkt viser "Legg i handlekurv" i staden for "Bli medlem"**
→ Sjekk at produktet har `type: "membership"` i Payload admin.
