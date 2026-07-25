"use client";

import { useState } from "react";

/** Om miljøvariablene er satt (kun ja/nei — aldri selve verdiene). */
export type EnvStatus = Record<string, boolean>;

type TabId = "stripe" | "vipps" | "testing" | "huskeliste";

const tabs: { id: TabId; label: string }[] = [
  { id: "stripe", label: "Stripe" },
  { id: "vipps", label: "Vipps" },
  { id: "testing", label: "Hvordan teste" },
  { id: "huskeliste", label: "Huskeliste" },
];

const card: React.CSSProperties = {
  background: "var(--theme-elevation-50)",
  border: "1px solid var(--theme-elevation-100)",
  borderRadius: "8px",
  padding: "1.25rem 1.5rem",
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section style={{ marginBottom: "2rem" }}>
    <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.75rem" }}>{title}</h2>
    {children}
  </section>
);

const Step = ({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) => (
  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
    <div
      style={{
        flexShrink: 0,
        width: "1.75rem",
        height: "1.75rem",
        borderRadius: "50%",
        background: "var(--theme-elevation-800)",
        color: "var(--theme-elevation-0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      {n}
    </div>
    <div style={{ ...card, flex: 1 }}>
      <strong style={{ display: "block", marginBottom: "0.35rem" }}>
        {title}
      </strong>
      <div
        style={{
          fontSize: "var(--font-body-size)",
          color: "var(--theme-elevation-650)",
          lineHeight: 1.6,
        }}
      >
        {children}
      </div>
    </div>
  </div>
);

const CodeBlock = ({ children }: { children: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ position: "relative", margin: "0.5rem 0" }}>
      <pre
        style={{
          background: "var(--theme-elevation-100)",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "6px",
          padding: "0.6rem 0.85rem",
          paddingRight: "4.5rem",
          fontSize: "0.8rem",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          margin: 0,
        }}
      >
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        style={{
          position: "absolute",
          top: "0.4rem",
          right: "0.4rem",
          border: "1px solid var(--theme-elevation-200)",
          background: "var(--theme-elevation-0)",
          borderRadius: "4px",
          padding: "0.15rem 0.5rem",
          fontSize: "0.7rem",
          cursor: "pointer",
          color: "var(--theme-elevation-650)",
        }}
      >
        {copied ? "Kopiert!" : "Kopier"}
      </button>
    </div>
  );
};

const Callout = ({
  variant = "info",
  children,
}: {
  variant?: "info" | "warning";
  children: React.ReactNode;
}) => (
  <div
    style={{
      ...card,
      borderLeft: `4px solid ${
        variant === "warning"
          ? "var(--theme-warning-500)"
          : "var(--theme-success-500)"
      }`,
      fontSize: "var(--font-body-size)",
      lineHeight: 1.6,
      marginBottom: "1rem",
    }}
  >
    {children}
  </div>
);

const EnvTable = ({
  vars,
  status,
}: {
  vars: { name: string; desc: string }[];
  status: EnvStatus;
}) => (
  <div style={{ ...card, padding: "0.5rem 0" }}>
    {vars.map((v, i) => (
      <div
        key={v.name}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.5rem 1.25rem",
          borderTop: i === 0 ? "none" : "1px solid var(--theme-elevation-100)",
        }}
      >
        <span
          title={status[v.name] ? "Satt i dette miljøet" : "Mangler"}
          style={{
            flexShrink: 0,
            width: "0.6rem",
            height: "0.6rem",
            borderRadius: "50%",
            background: status[v.name]
              ? "var(--theme-success-500)"
              : "var(--theme-error-500)",
          }}
        />
        <code style={{ fontSize: "0.8rem", minWidth: "16rem" }}>{v.name}</code>
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          {v.desc}
        </span>
      </div>
    ))}
  </div>
);

const TestCard = ({
  number,
  label,
  outcome,
}: {
  number: string;
  label: string;
  outcome: "ok" | "fail" | "extra";
}) => {
  const [copied, setCopied] = useState(false);
  const colors = {
    ok: "var(--theme-success-500)",
    fail: "var(--theme-error-500)",
    extra: "var(--theme-warning-500)",
  };
  return (
    <button
      type="button"
      title="Klikk for å kopiere kortnummeret"
      onClick={() => {
        navigator.clipboard.writeText(number.replaceAll(" ", ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        ...card,
        borderTop: `3px solid ${colors[outcome]}`,
        padding: "0.85rem 1rem",
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
      }}
    >
      <code
        style={{
          display: "block",
          fontSize: "0.95rem",
          letterSpacing: "0.05em",
          marginBottom: "0.3rem",
        }}
      >
        {copied ? "Kopiert!" : number}
      </code>
      <span style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)" }}>
        {label}
      </span>
    </button>
  );
};

const StripeTab = ({ env }: { env: EnvStatus }) => (
  <>
    <Section title="Miljøvariabler">
      <EnvTable
        status={env}
        vars={[
          {
            name: "STRIPE_SECRET_KEY",
            desc: "Hemmelig nøkkel (sk_test_ / sk_live_)",
          },
          {
            name: "STRIPE_WEBHOOK_SECRET",
            desc: "Signeringshemmelighet for webhooken (whsec_...)",
          },
          {
            name: "NEXT_PUBLIC_URL",
            desc: "Base-URL for suksess-/avbrutt-sider",
          },
        ]}
      />
    </Section>

    <Section title="Oppsett steg for steg">
      <Step n={1} title="Hent API-nøkkel">
        Gå til{" "}
        <a
          href="https://dashboard.stripe.com/apikeys"
          target="_blank"
          rel="noreferrer"
        >
          Stripe Dashboard → Developers → API keys
        </a>{" "}
        og kopier «Secret key» inn i <code>STRIPE_SECRET_KEY</code>. Bruk{" "}
        <code>sk_test_...</code> i test og <code>sk_live_...</code> i
        produksjon.
      </Step>
      <Step n={2} title="Opprett webhook-endepunkt">
        I{" "}
        <a
          href="https://dashboard.stripe.com/webhooks"
          target="_blank"
          rel="noreferrer"
        >
          Developers → Webhooks
        </a>
        , legg til et endepunkt som peker på:
        <CodeBlock>{"https://<ditt-domene>/api/webhooks/stripe"}</CodeBlock>
      </Step>
      <Step n={3} title="Velg hendelser">
        Webhooken vår håndterer disse hendelsene — velg akkurat disse i Stripe:
        <CodeBlock>{`checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed`}</CodeBlock>
      </Step>
      <Step n={4} title="Kopier signeringshemmeligheten">
        Etter at endepunktet er opprettet viser Stripe en «Signing secret» (
        <code>whsec_...</code>). Legg den i <code>STRIPE_WEBHOOK_SECRET</code> —
        uten den avvises alle webhook-kall.
      </Step>
    </Section>

    <Section title="Verdt å vite">
      <Callout>
        <strong>Priser:</strong> lagres i <strong>kroner</strong> i Payload og
        sendes til Stripe som <code>price_data</code> ved checkout (ganges med
        100 til øre). Vi oppretter altså ikke priser i Stripe Dashboard.
      </Callout>
      <Callout>
        <strong>Rabattkoder:</strong> lages som «Promotion Codes» direkte i
        Stripe Dashboard (Products → Coupons). Nettsiden validerer koden via{" "}
        <code>/api/coupon</code> og legger den på checkout automatisk.
      </Callout>
      <Callout>
        Webhooken håndterer både <strong>produktkjøp</strong> (oppretter
        bestilling i Payload + sender kvittering) og <strong>medlemskap</strong>{" "}
        (synkes til planner-databasen). Alle hendelser lagres med
        idempotens-nøkkel, så dobbeltkjøring er trygt.
      </Callout>
    </Section>
  </>
);

const VippsTab = ({ env }: { env: EnvStatus }) => (
  <>
    <Section title="Miljøvariabler">
      <EnvTable
        status={env}
        vars={[
          {
            name: "VIPPS_MSN",
            desc: "Merchant Serial Number (salgsstedsnummer)",
          },
          { name: "VIPPS_CLIENT_ID", desc: "Client ID fra API-nøklene" },
          {
            name: "VIPPS_CLIENT_SECRET",
            desc: "Client Secret fra API-nøklene",
          },
          { name: "VIPPS_SUBSCRIPTION_KEY", desc: "Ocp-Apim-Subscription-Key" },
          {
            name: "VIPPS_API_URL",
            desc: "https://apitest.vipps.no (test) / https://api.vipps.no (prod)",
          },
          {
            name: "VIPPS_WEBHOOK_SECRET",
            desc: "Fås ved webhook-registrering (se steg 3)",
          },
        ]}
      />
    </Section>

    <Section title="Oppsett steg for steg">
      <Step n={1} title="Hent API-nøkler i portalen">
        Logg inn på{" "}
        <a
          href="https://portal.vippsmobilepay.com"
          target="_blank"
          rel="noreferrer"
        >
          portal.vippsmobilepay.com
        </a>{" "}
        → «Utvikler» → «API-nøkler». Der finner du MSN, Client ID, Client Secret
        og Subscription Key. Testmiljøet (MT) har egne nøkler — ikke bland dem
        med produksjonsnøklene.
      </Step>
      <Step n={2} title="Sett riktig API-URL">
        <code>VIPPS_API_URL</code> styrer hvilket miljø vi snakker med:
        <CodeBlock>{`# Test (Merchant Test)
VIPPS_API_URL=https://apitest.vipps.no
# Produksjon
VIPPS_API_URL=https://api.vipps.no`}</CodeBlock>
      </Step>
      <Step n={3} title="Registrer webhooken med scriptet">
        Vipps har ikke webhook-oppsett i portalen — det gjøres via API. Vi har
        et ferdig script som registrerer <code>/api/webhooks/vipps</code> og
        skriver ut hemmeligheten:
        <CodeBlock>
          {"cd apps/web && bun scripts/register-vipps-webhook.ts"}
        </CodeBlock>
        Legg verdien scriptet skriver ut i <code>VIPPS_WEBHOOK_SECRET</code>.
      </Step>
      <Step n={4} title="Ta vare på hemmeligheten">
        Hemmeligheten vises <strong>kun ved registrering</strong>. Mister du
        den, må webhooken slettes og registreres på nytt (scriptet viser
        hvordan). Kjører du scriptet på nytt uten endringer, lister det bare
        eksisterende webhooks.
      </Step>
    </Section>

    <Section title="Verdt å vite">
      <Callout variant="warning">
        Vipps krever en offentlig <strong>https</strong>-URL for webhooken — den
        kan ikke peke på localhost. For lokal testing: bruk en tunnel (f.eks.
        ngrok) og send tunnel-URL-en som argument til scriptet. Bytter du domene
        (<code>NEXT_PUBLIC_URL</code>), må webhooken registreres på nytt.
      </Callout>
      <Callout>
        <strong>Flyten:</strong> kunden sendes til Vipps → betaling autoriseres
        → webhooken fanger <code>authorized</code>, trekker beløpet (capture),
        setter bestillingen til «betalt» og sender kvittering. Avbrutt/utløpt
        betaling setter bestillingen til «kansellert».
      </Callout>
      <Callout>
        <strong>Medlemskap kan ikke kjøpes med Vipps</strong> — abonnement
        krever kort via Stripe. Vipps gjelder kun enkeltprodukter.
      </Callout>
    </Section>
  </>
);

const TestingTab = () => (
  <>
    <Section title="Teste Stripe">
      <Step n={1} title="Bruk testnøkler">
        Sørg for at <code>STRIPE_SECRET_KEY</code> starter med{" "}
        <code>sk_test_</code>. Da vises alt i Stripe Dashboard under «Test
        mode», og ingen ekte penger flyttes.
      </Step>
      <Step n={2} title="Kjør webhooken lokalt med Stripe CLI">
        Stripe kan ikke nå localhost direkte — bruk{" "}
        <a
          href="https://stripe.com/docs/stripe-cli"
          target="_blank"
          rel="noreferrer"
        >
          Stripe CLI
        </a>{" "}
        til å videresende hendelser:
        <CodeBlock>
          {"stripe listen --forward-to localhost:3000/api/webhooks/stripe"}
        </CodeBlock>
        CLI-en skriver ut en midlertidig <code>whsec_...</code> — bruk den som{" "}
        <code>STRIPE_WEBHOOK_SECRET</code> lokalt mens den kjører.
      </Step>
      <Step n={3} title="Gjennomfør et testkjøp">
        Legg et produkt i handlekurven, gå til kassen og betal med et av
        testkortene under. Utløpsdato: hvilken som helst fremtidig dato. CVC:
        hva som helst.
      </Step>
    </Section>

    <Section title="Stripe-testkort (klikk for å kopiere)">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
          gap: "0.75rem",
        }}
      >
        <TestCard
          number="4242 4242 4242 4242"
          label="Vellykket betaling"
          outcome="ok"
        />
        <TestCard
          number="4000 0025 0000 3155"
          label="Krever 3D Secure-bekreftelse"
          outcome="extra"
        />
        <TestCard
          number="4000 0000 0000 9995"
          label="Avvist — ikke dekning"
          outcome="fail"
        />
        <TestCard
          number="4000 0000 0000 0002"
          label="Avvist — generell feil"
          outcome="fail"
        />
      </div>
    </Section>

    <Section title="Teste Vipps">
      <Step n={1} title="Bruk testmiljøet (MT)">
        Sett <code>VIPPS_API_URL=https://apitest.vipps.no</code> og bruk
        test-nøklene fra portalen. Testmiljøet er helt adskilt fra produksjon.
      </Step>
      <Step n={2} title="Skaff testbruker og MT-app">
        I{" "}
        <a
          href="https://portal.vippsmobilepay.com"
          target="_blank"
          rel="noreferrer"
        >
          portalen
        </a>{" "}
        (testmiljøet) kan du opprette testbrukere med fiktive telefonnumre. Last
        ned <strong>Vipps MT-appen</strong> (egen testapp, ikke vanlig Vipps) og
        logg inn med testbrukeren for å godkjenne betalinger.
      </Step>
      <Step n={3} title="Webhook trenger tunnel lokalt">
        Vipps-webhooken må nå en offentlig https-URL. Lokalt: start en tunnel og
        registrer den midlertidig:
        <CodeBlock>{`ngrok http 3000
cd apps/web && bun scripts/register-vipps-webhook.ts https://<ngrok-url>/api/webhooks/vipps`}</CodeBlock>
        Alternativt: test Vipps-flyten på et deployet forhåndsvisningsmiljø i
        stedet.
      </Step>
    </Section>

    <Section title="Sjekkliste etter testkjøp">
      <Callout>
        <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
          <li>
            Bestillingen finnes under <strong>Nettbutikk → Bestillinger</strong>{" "}
            med riktig status («betalt», ikke hengende i «venter»)
          </li>
          <li>Kvitterings-e-post er sendt (sjekk Resend-dashbordet)</li>
          <li>Kvitteringssiden (/kvittering) viser riktig ordre</li>
          <li>
            Ved Stripe: hendelsen vises som levert under Developers → Webhooks
            (status 200)
          </li>
          <li>Ved rabattkode: beløpet i bestillingen stemmer med rabatten</li>
        </ol>
      </Callout>
    </Section>
  </>
);

const ChecklistTab = ({ env }: { env: EnvStatus }) => (
  <>
    <Section title="Felles miljøvariabler">
      <EnvTable
        status={env}
        vars={[
          {
            name: "NEXT_PUBLIC_URL",
            desc: "Base-URL — brukes i retur-URL-er for både Stripe og Vipps",
          },
          {
            name: "RESEND_API_KEY",
            desc: "Kvitterings- og bekreftelses-e-poster",
          },
          { name: "DATABASE_URI", desc: "Postgres (Payload + planner-skjema)" },
          { name: "PAYLOAD_SECRET", desc: "Payload-kryptering og innlogging" },
        ]}
      />
    </Section>

    <Section title="Huskeliste ved lansering / nytt miljø">
      <Callout variant="warning">
        <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.8 }}>
          <li>
            Bytt Stripe til <code>sk_live_</code>-nøkkel og opprett{" "}
            <strong>nytt webhook-endepunkt</strong> i live-modus (test-webhooks
            følger ikke med over)
          </li>
          <li>
            Bytt <code>VIPPS_API_URL</code> til{" "}
            <code>https://api.vipps.no</code> og bruk produksjonsnøklene fra
            portalen
          </li>
          <li>
            Kjør Vipps webhook-scriptet på nytt mot produksjonsdomenet og
            oppdater <code>VIPPS_WEBHOOK_SECRET</code>
          </li>
          <li>
            Sjekk at <code>NEXT_PUBLIC_URL</code> peker på riktig domene —
            retur-URL-er og webhook-registrering bygges av denne
          </li>
          <li>
            Verifiser Resend-domenet og sett riktig avsenderadresse, ellers
            havner kvitteringer i søppelpost (eller sendes ikke)
          </li>
          <li>Gjør et ekte kjøp med lite beløp som siste sjekk</li>
        </ol>
      </Callout>
    </Section>

    <Section title="Godt å vite">
      <Callout>
        <strong>Idempotens:</strong> alle webhook-hendelser (både Stripe og
        Vipps) lagres i databasen med unik nøkkel før de behandles. Kommer samme
        hendelse to ganger, ignoreres den andre — det er trygt å be Stripe/Vipps
        sende på nytt.
      </Callout>
      <Callout>
        <strong>Feilhåndtering i Vipps-webhooken:</strong> feiler behandlingen,
        lagres ikke hendelsen — da prøver Vipps automatisk på nytt senere.
        Hengende «venter»-bestillinger kan derfor løse seg selv etter noen
        minutter.
      </Callout>
      <Callout>
        Statusprikkene på denne siden viser om variablene er satt i miljøet{" "}
        <strong>denne serveren</strong> kjører i — grønn her betyr ikke at
        produksjon er riktig satt opp hvis du ser på et testmiljø.
      </Callout>
    </Section>
  </>
);

export const SetupGuideTabs = ({ env }: { env: EnvStatus }) => {
  const [active, setActive] = useState<TabId>("stripe");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.25rem",
          borderBottom: "1px solid var(--theme-elevation-150)",
          marginBottom: "1.5rem",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            style={{
              font: "inherit",
              fontSize: "var(--font-body-size)",
              fontWeight: active === tab.id ? 600 : 400,
              color:
                active === tab.id
                  ? "var(--theme-text)"
                  : "var(--theme-elevation-500)",
              background: "none",
              border: "none",
              borderBottom:
                active === tab.id
                  ? "2px solid var(--theme-text)"
                  : "2px solid transparent",
              padding: "0.6rem 1rem",
              marginBottom: "-1px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === "stripe" && <StripeTab env={env} />}
      {active === "vipps" && <VippsTab env={env} />}
      {active === "testing" && <TestingTab />}
      {active === "huskeliste" && <ChecklistTab env={env} />}
    </div>
  );
};
