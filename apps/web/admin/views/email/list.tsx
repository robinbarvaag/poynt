import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { resolveBroadcastTarget } from "@poynt/email";
import Link from "next/link";
import type { AdminViewServerProps } from "payload";
import { NotificationEmailsField } from "../../components/email/notification-emails-field";

/**
 * E-postoversikt (/admin/epost): helse- og oversiktspanelet for e-post.
 * Viser om oppsettet er i orden (statuspiller), hvem som får interne varsler,
 * og en samlet liste over alle e-postene nettsiden sender — med lenke rett til
 * stedet der hver enkelt redigeres og forhåndsvises. Selve forhåndsvisningene
 * bor der tekstene redigeres (E-postmaler, skjemaene, Kasse og kvittering,
 * Nyhetsbrev), ikke her.
 */

interface EmailRow {
  label: string;
  description: string;
  href: string;
}

/** Beskrivelser per mal i «E-postmaler» — lett hverdagsspråk. */
const TEMPLATE_ROWS: {
  key: string;
  group: string;
  label: string;
  description: string;
}[] = [
  {
    key: "contact-confirmation",
    group: "Til kunden",
    label: "Kontakt-bekreftelse",
    description:
      "Kvittering til den som sender inn kontaktskjemaet — «vi har mottatt meldingen din».",
  },
  {
    key: "sale-notification",
    group: "Interne varsler (til dere)",
    label: "Salgsvarsel",
    description:
      "Til varslingsadressene hver gang noen kjøper noe eller tegner et On Poynt-medlemskap.",
  },
  {
    key: "contact-notification",
    group: "Interne varsler (til dere)",
    label: "Kontakt-varsel",
    description:
      "Til varslingsadressene når noen sender inn kontaktskjemaet (og ved venteliste-påmeldinger).",
  },
  {
    key: "newsletter-signup-notification",
    group: "Interne varsler (til dere)",
    label: "Nyhetsbrev-påmelding",
    description: "Til varslingsadressene når noen melder seg på nyhetsbrevet.",
  },
  {
    key: "welcome-member",
    group: "On Poynt",
    label: "Velkommen som medlem",
    description:
      "Til nye On Poynt-medlemmer rett etter at abonnementet er tegnet.",
  },
  {
    key: "magic-link",
    group: "On Poynt",
    label: "Innloggingslenke",
    description: "Til medlemmer som logger inn på On Poynt med e-post.",
  },
  {
    key: "password-reset",
    group: "On Poynt",
    label: "Tilbakestill passord",
    description: "Til admin-brukere som ber om nytt passord til Payload-admin.",
  },
];

export const EmailOverviewView = async (props: AdminViewServerProps) => {
  const siteSettings = await props.payload
    .findGlobal({ slug: "site-settings" })
    .catch(() => null);

  // Nyere Resend-kontoer har innebygde segmenter — sjekk om utsending faktisk
  // har en mottakerliste, i stedet for å kreve en env-variabel blindt.
  const broadcastTarget = process.env.RESEND_API_KEY
    ? await resolveBroadcastTarget()
    : null;

  // Kun tilstedeværelse (satt/ikke satt) vises — aldri verdiene.
  const checks = [
    {
      name: "Resend-nøkkel",
      ok: Boolean(process.env.RESEND_API_KEY),
      hint: "RESEND_API_KEY: uten denne sendes ingen e-post i det hele tatt.",
    },
    {
      name: "Avsenderadresse",
      ok: Boolean(process.env.EMAIL_FROM),
      hint: "EMAIL_FROM: må være et verifisert domene i Resend.",
    },
    {
      name: "Varslingsadresser",
      ok: Boolean(
        siteSettings?.notificationEmails || process.env.CONTACT_EMAIL
      ),
      hint: "Hvem som får de interne varslene — redigeres i feltet under.",
    },
    {
      name: "Nyhetsbrev-utsending",
      ok: broadcastTarget !== null,
      hint: "Mottakerlista i Resend. Finnes automatisk på nyere kontoer; eldre kontoer kan sette RESEND_AUDIENCE_ID.",
    },
  ];

  // Malene i «E-postmaler» — lenkes direkte til hvert dokument.
  const templateDocs = await props.payload
    .find({ collection: "email-templates", limit: 20, depth: 0 })
    .catch(() => null);
  const templateIds = new Map<string, string | number>();
  for (const doc of templateDocs?.docs ?? []) {
    templateIds.set(doc.templateKey, doc.id);
  }

  // Skjemaer med egne e-poster («E-poster ved innsending»).
  const forms = await props.payload
    .find({ collection: "forms", limit: 100, depth: 0 })
    .catch(() => null);
  const formRows: EmailRow[] = (forms?.docs ?? [])
    .filter((form) => Array.isArray(form.emails) && form.emails.length > 0)
    .map((form) => ({
      label: `«${form.title}» – bekreftelse`,
      description:
        "Sendes automatisk til innsenderen når skjemaet sendes inn. Redigeres på skjemaet, med egen forhåndsvisnings-fane.",
      href: `/admin/collections/forms/${form.id}`,
    }));

  const templateRow = (key: string): EmailRow[] => {
    const row = TEMPLATE_ROWS.find((entry) => entry.key === key);
    if (!row) return [];
    const id = templateIds.get(key);
    return [
      {
        label: row.label,
        description: row.description,
        href: id
          ? `/admin/collections/email-templates/${id}`
          : "/admin/collections/email-templates",
      },
    ];
  };

  const groups: { title: string; rows: EmailRow[] }[] = [
    {
      title: "Til kunden",
      rows: [
        {
          label: "Ordrebekreftelse",
          description:
            "Kvittering etter kjøp i nettbutikken (Stripe og Vipps) — kjøpte PDF-er legges ved. Redigeres i «Kasse og kvittering».",
          href: "/admin/globals/checkout-settings",
        },
        ...templateRow("contact-confirmation"),
        ...formRows,
        {
          label: "Nyhetsbrev",
          description:
            "Skrives og sendes fra Nyhetsbrev, med egen forhåndsvisnings-fane mens du skriver.",
          href: "/admin/collections/newsletters",
        },
      ],
    },
    {
      title: "Interne varsler (til dere)",
      rows: [
        ...templateRow("sale-notification"),
        ...templateRow("contact-notification"),
        ...templateRow("newsletter-signup-notification"),
      ],
    },
    {
      title: "On Poynt",
      rows: [
        ...templateRow("welcome-member"),
        ...templateRow("magic-link"),
        ...templateRow("password-reset"),
      ],
    },
  ];

  const visibleEntities = getVisibleEntities({ req: props.initPageResult.req });

  return (
    <DefaultTemplate
      i18n={props.i18n}
      payload={props.payload}
      permissions={props.initPageResult.permissions}
      visibleEntities={visibleEntities}
    >
      <SetStepNav nav={[{ label: "E-post" }]} />
      <div style={{ width: "100%" }}>
        <Gutter>
          <div style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{ margin: 0 }}>E-post</h1>
          </div>
          <p
            style={{
              marginBottom: "1rem",
              maxWidth: "70ch",
              color: "var(--theme-elevation-500)",
            }}
          >
            Oversikten over alle e-postene nettsiden sender. Hver e-post
            redigeres på sitt eget sted — alltid med forhåndsvisning rett ved
            siden av teksten. Klikk deg inn for å endre.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap",
              marginBottom: "1.5rem",
            }}
          >
            {checks.map((check) => (
              <span
                key={check.name}
                title={check.hint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.25rem 0.7rem",
                  borderRadius: "999px",
                  fontSize: "0.75rem",
                  border: "1px solid var(--theme-elevation-150)",
                  color: "var(--theme-elevation-600)",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: check.ok
                      ? "var(--theme-success-500)"
                      : "var(--theme-error-500)",
                  }}
                />
                {check.name}
              </span>
            ))}
          </div>
          <NotificationEmailsField
            initialValue={siteSettings?.notificationEmails ?? ""}
            envFallback={Boolean(process.env.CONTACT_EMAIL)}
          />

          {groups.map((group) => (
            <section key={group.title} style={{ marginBottom: "1.75rem" }}>
              <h2
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--theme-elevation-400)",
                }}
              >
                {group.title}
              </h2>
              <div
                style={{
                  border: "1px solid var(--theme-elevation-150)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                {group.rows.map((row, index) => (
                  <Link
                    key={row.label}
                    href={row.href}
                    prefetch={false}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.75rem 1rem",
                      textDecoration: "none",
                      borderTop:
                        index > 0
                          ? "1px solid var(--theme-elevation-100)"
                          : "none",
                    }}
                  >
                    <span>
                      <span
                        style={{
                          display: "block",
                          fontWeight: 600,
                          color: "var(--theme-elevation-800)",
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          color: "var(--theme-elevation-500)",
                          maxWidth: "70ch",
                        }}
                      >
                        {row.description}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      style={{
                        color: "var(--theme-elevation-400)",
                        flexShrink: 0,
                      }}
                    >
                      Rediger →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};
