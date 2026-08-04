import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter, SetStepNav } from "@payloadcms/ui";
import { getVisibleEntities } from "@payloadcms/ui/shared";
import { renderEmailPreviews, resolveBroadcastTarget } from "@poynt/email";
import type { AdminViewServerProps } from "payload";
import { buildFormEmailPreviews } from "../../../lib/form-email-previews";
import { NotificationEmailsField } from "../../components/email/notification-emails-field";
import { EmailPreviewPanel } from "../../components/email/preview-panel";

/**
 * E-postoversikt (/admin/epost): alle e-postene nettsiden sender, med
 * forhåndsvisning slik de ser ut hos mottakeren, og redigering av hvem som
 * får de interne varslene. Ordrebekreftelsen vises med de faktiske tekstene
 * fra «Kasse og kvittering».
 */

export const EmailOverviewView = async (props: AdminViewServerProps) => {
  const settings = await props.payload
    .findGlobal({ slug: "checkout-settings" })
    .catch(() => null);
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

  const templatePreviews = await renderEmailPreviews({
    orderSubject: settings?.emailSubject ?? undefined,
    orderContent: settings
      ? {
          heading: settings.emailHeading ?? undefined,
          intro: settings.emailIntro ?? undefined,
          pdfNote: settings.emailPdfNote ?? undefined,
          footer: settings.emailFooter ?? undefined,
        }
      : undefined,
  });

  // E-postene partneren har satt opp selv på skjemaene («E-poster ved
  // innsending») — vist med faktisk innhold og lenke til der de redigeres,
  // rett etter «Til kunden»-gruppa.
  const formEmailPreviews = await buildFormEmailPreviews(props.payload);
  const lastCustomerIndex = templatePreviews.reduce(
    (last, preview, index) => (preview.group === "Til kunden" ? index : last),
    -1
  );
  const previews = [
    ...templatePreviews.slice(0, lastCustomerIndex + 1),
    ...formEmailPreviews,
    ...templatePreviews.slice(lastCustomerIndex + 1),
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
            Her ser du alle e-postene nettsiden sender — til kundene og til
            dere. Forhåndsvisningene bruker eksempeldata, men der teksten kan
            redigeres (ordrebekreftelsen, skjema-bekreftelsene, nyhetsbrevet)
            vises det du selv har skrevet, med lenke til der du endrer det.
            E-poster uten lenke har fast tekst.
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
          <EmailPreviewPanel previews={previews} />
        </Gutter>
      </div>
    </DefaultTemplate>
  );
};
