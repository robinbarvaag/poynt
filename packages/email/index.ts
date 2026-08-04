import { Resend } from "resend";
import type {
  OrderConfirmationContent,
  OrderConfirmationItem,
} from "./templates/order-confirmation";

export type { OrderConfirmationContent, OrderConfirmationItem };
export {
  renderEmailPreviews,
  type EmailPreview,
  type PreviewTemplateOverrides,
} from "./previews";

export interface EmailAttachment {
  filename: string;
  /** Filinnhold, base64-kodet. */
  content: string;
}

/**
 * Admin-redigert overstyring av en e-postmal (fra «E-postmaler» i Payload).
 * `subject` og `bodyHtml` kan inneholde {{flettefelt}} som fylles ved sending.
 */
export interface EmailTemplateOverride {
  subject?: string;
  bodyHtml?: string;
}

type EmailTemplateProvider = (
  key: string
) => Promise<EmailTemplateOverride | null>;

let templateProvider: EmailTemplateProvider | null = null;

/**
 * Registrer oppslaget mot admin-redigerte maler («E-postmaler» i Payload).
 * Appen registrerer denne ved oppstart (instrumentation.ts); send-funksjonene
 * slår så opp malen selv. Uten provider (seed-scripts o.l.) brukes de kodede
 * standardtekstene.
 */
export function setEmailTemplateProvider(provider: EmailTemplateProvider) {
  templateProvider = provider;
}

/** Hent overstyring for en mal — feil skal aldri velte en utsending. */
async function getTemplateOverride(
  key: string
): Promise<EmailTemplateOverride | null> {
  if (!templateProvider) return null;
  try {
    return await templateProvider(key);
  } catch (error) {
    console.error(`Klarte ikke hente e-postmalen «${key}»:`, error);
    return null;
  }
}

/**
 * Fyll {{flettefelt}} med verdier. Ukjente felt fjernes (blir tom streng) —
 * i forhåndsvisningen brukes i stedet eksempeldata, se previews.ts.
 */
export function fillEmailWildcards(
  text: string,
  values: Record<string, string | number | undefined>
): string {
  return text.replace(/\{\{(.+?)\}\}/g, (_, raw: string) => {
    const value = values[raw.trim().toLowerCase()];
    return value === undefined || value === null ? "" : String(value);
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * subject/bodyHtml fra en overstyring, ferdig utfylt med flettefelt-verdier.
 * Verdiene kommer fra besøkende (navn, melding …) og HTML-escapes i brødteksten
 * så innsendt tekst aldri kan smugle inn HTML i e-posten.
 */
function applyTemplate(
  override: EmailTemplateOverride | null,
  values: Record<string, string | number | undefined>
): { subject?: string; contentHtml?: string } {
  if (!override) return {};
  const htmlSafeValues = Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === undefined
        ? undefined
        : escapeHtml(String(value)).replace(/\n/g, "<br />"),
    ])
  );
  return {
    subject: override.subject
      ? fillEmailWildcards(override.subject, values)
      : undefined,
    contentHtml: override.bodyHtml
      ? fillEmailWildcards(override.bodyHtml, htmlSafeValues)
      : undefined,
  };
}

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(key);
  }
  return _resend;
}

// For backward compatibility - lazy getter
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    return getResend()[prop as keyof Resend];
  },
});

/**
 * Bygg avsender-adressa. Sett `EMAIL_FROM` til et verifisert domene i Resend,
 * f.eks. `no-reply@poynt.no` eller hele strengen `On Poynt <no-reply@poynt.no>`.
 *
 * Faller tilbake til Resend sitt sandbox-domene `onboarding@resend.dev`, som i
 * test-modus KUN leverer til Resend-kontoens egen e-postadresse — derfor må
 * `EMAIL_FROM` settes (og domenet verifiseres) for å sende til andre.
 */
function buildFrom(displayName: string): string {
  const configured = process.env.EMAIL_FROM;
  if (!configured) {
    return `${displayName} <onboarding@resend.dev>`;
  }
  // Tillat enten en bar adresse ("no-reply@poynt.no") eller full "Navn <adr>".
  return configured.includes("<")
    ? configured
    : `${displayName} <${configured}>`;
}

type SendPayload = Parameters<Resend["emails"]["send"]>[0];

/**
 * Send via Resend og kast på feil. Resend-SDK-en kaster IKKE selv på API-feil
 * (den returnerer `{ data, error }`), så uten denne sjekken feiler utsending
 * stille og kallere tror alt gikk bra.
 */
async function sendEmail(payload: SendPayload) {
  const { data, error } = await getResend().emails.send(payload);
  if (error) {
    console.error("Resend e-post feilet:", {
      to: payload.to,
      subject: payload.subject,
      error,
    });
    throw new Error(
      `Resend e-post feilet (${payload.subject}): ${error.message ?? "ukjent feil"}`
    );
  }
  return data;
}

/**
 * Vipps-testbrukere har fiktive adresser (@vippsmobilepay.com) som aldri kan
 * motta e-post. Sett ORDER_TEST_EMAIL_RECIPIENTS (kommaseparert) for å få
 * disse e-postene levert til dere selv under testing i stedet.
 */
function resolveRecipients(email: string): string | string[] {
  const testRecipients = process.env.ORDER_TEST_EMAIL_RECIPIENTS;
  if (testRecipients && email.toLowerCase().endsWith("@vippsmobilepay.com")) {
    return testRecipients
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean);
  }
  return email;
}

export async function sendOrderConfirmation(params: {
  email: string;
  orderNumber: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr. */
  total: number;
  /** Admin-redigerbart emnefelt – ordrenummer legges på automatisk. */
  subject?: string;
  /** Admin-redigerbare tekster i e-posten. */
  content?: OrderConfirmationContent;
  /** Vedlegg (f.eks. kjøpte PDF-er), base64-kodet. */
  attachments?: EmailAttachment[];
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: OrderConfirmationEmail } = await import(
    "./templates/order-confirmation"
  );

  const html = await render(
    OrderConfirmationEmail({
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      items: params.items,
      total: params.total,
      content: params.content,
      hasAttachments: (params.attachments?.length ?? 0) > 0,
    })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: resolveRecipients(params.email),
    subject: `${params.subject || "Ordrebekreftelse"} #${params.orderNumber}`,
    html,
    ...(params.attachments?.length && { attachments: params.attachments }),
  });
}

/**
 * Mottakere for interne varsler: eksplisitt `to` fra kalleren (typisk
 * admin-innstillingen via getNotificationEmails) vinner, ellers CONTACT_EMAIL.
 * undefined → varselet droppes stille.
 */
function resolveNotifyTo(
  override?: string | string[]
): string | string[] | undefined {
  if (Array.isArray(override)) {
    return override.length > 0 ? override : undefined;
  }
  return override || process.env.CONTACT_EMAIL || undefined;
}

/**
 * Internt varsel til Poynt når det kommer et salg — produktkjøp eller nytt
 * medlemskap. Skal ALDRI velte ordreflyten: no-op hvis mottaker eller
 * RESEND_API_KEY mangler, og kallere bør svelge feil.
 */
export async function sendSaleNotification(params: {
  /** Mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  /** «Produktsalg» eller «Nytt medlemskap». */
  kind: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail: string;
  items: { name: string; quantity?: number; price?: number }[];
  /** Totalsum i kr. */
  total?: number;
  paymentProvider?: string;
  /** Lenke til ordren i admin. */
  adminUrl?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const notifyTo = resolveNotifyTo(params.to);
  if (!notifyTo) return;

  const { render } = await import("@react-email/render");
  const { default: SaleNotificationEmail } = await import(
    "./templates/sale-notification"
  );

  const template = applyTemplate(
    await getTemplateOverride("sale-notification"),
    {
      type: params.kind,
      ordrenummer: params.orderNumber,
      navn: params.customerName,
      epost: params.customerEmail,
      sum: params.total,
      betaling: params.paymentProvider,
    }
  );

  const html = await render(
    SaleNotificationEmail({ ...params, introHtml: template.contentHtml })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: notifyTo,
    subject:
      template.subject ||
      (params.total
        ? `${params.kind}: ${params.total} kr${params.orderNumber ? ` (#${params.orderNumber})` : ""}`
        : `${params.kind}: ${params.customerEmail}`),
    html,
  });
}

/**
 * Internt varsel til Poynt (CONTACT_EMAIL) når noen melder seg på nyhetsbrevet.
 * No-op hvis CONTACT_EMAIL eller RESEND_API_KEY mangler; kallere bør svelge feil
 * slik at selve påmeldingen aldri feiler på grunn av varselet.
 */
export async function sendNewsletterSignupNotification(params: {
  /** Mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  email: string;
  /** Hvor påmeldingen kom fra, f.eks. «nyhetsbrev-skjema» eller «utsjekk». */
  source?: string;
}) {
  if (!process.env.RESEND_API_KEY) return;
  const notifyTo = resolveNotifyTo(params.to);
  if (!notifyTo) return;

  const { render } = await import("@react-email/render");
  const { default: NewsletterSignupNotificationEmail } = await import(
    "./templates/newsletter-signup-notification"
  );

  const template = applyTemplate(
    await getTemplateOverride("newsletter-signup-notification"),
    { epost: params.email, kilde: params.source }
  );

  const html = await render(
    NewsletterSignupNotificationEmail({
      ...params,
      introHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("Poynt"),
    to: notifyTo,
    subject: template.subject || `Ny på nyhetsbrevet: ${params.email}`,
    html,
  });
}

/**
 * Send en branded magisk innloggingslenke til et On Poynt-medlem.
 * No-op hvis RESEND_API_KEY mangler.
 */
export async function sendMagicLinkEmail(params: {
  email: string;
  url: string;
  expiresInMinutes?: number;
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: MagicLinkEmail } = await import("./templates/magic-link");

  const template = applyTemplate(await getTemplateOverride("magic-link"), {
    minutter: params.expiresInMinutes ?? 10,
  });

  const html = await render(
    MagicLinkEmail({
      url: params.url,
      expiresInMinutes: params.expiresInMinutes,
      contentHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: template.subject || "Logg inn på On Poynt",
    html,
  });
}

/**
 * Render den branda «tilbakestill passord»-e-posten til HTML.
 * Brukes av Payload-admin (Users-collection) sin forgotPassword-hook.
 */
export async function renderPasswordResetEmail(params: {
  url: string;
  name?: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: PasswordResetEmail } = await import(
    "./templates/password-reset"
  );

  const template = applyTemplate(await getTemplateOverride("password-reset"), {
    navn: params.name,
  });

  return render(
    PasswordResetEmail({
      url: params.url,
      name: params.name,
      contentHtml: template.contentHtml,
    })
  );
}

/**
 * Emnefeltet for en mal: admin-redigert hvis satt (med flettefelt utfylt),
 * ellers standardteksten. Brukes der emnet genereres separat fra innholdet
 * (f.eks. Payload sin forgotPassword-hook).
 */
export async function resolveTemplateSubject(
  key: string,
  values: Record<string, string | number | undefined>,
  fallback: string
): Promise<string> {
  const override = await getTemplateOverride(key);
  return override?.subject
    ? fillEmailWildcards(override.subject, values)
    : fallback;
}

/**
 * Subscribe an email to the newsletter audience in Resend
 */
export async function subscribeToNewsletter(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  // Nyere Resend-kontoer har én innebygd audience — audienceId er da valgfri.
  // Settes RESEND_AUDIENCE_ID, brukes den eksplisitt (eldre kontoer).
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const result = await getResend().contacts.create({
      ...(audienceId && { audienceId }),
      email,
      unsubscribed: false,
    });

    if (result.error) {
      // Kontakten finnes fra før — kan være avmeldt, så re-abonner eksplisitt
      // (contacts.create setter aldri unsubscribed tilbake til false).
      if (result.error.message?.includes("already exists")) {
        const update = await getResend().contacts.update({
          ...(audienceId && { audienceId }),
          email,
          unsubscribed: false,
        });
        if (update.error) {
          return { success: false, error: update.error.message };
        }
        return { success: true };
      }
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ukjent feil",
    };
  }
}

/**
 * Render nyhetsbrevet (Poynt-ramma rundt ferdig richtext-HTML). Brukes både ved
 * utsending og av «Forhåndsvisning»-fanen på Nyhetsbrev-dokumentet i admin.
 */
export async function renderNewsletterHtml(params: {
  preview: string;
  contentHtml: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: NewsletterEmail } = await import("./templates/newsletter");
  return render(NewsletterEmail(params));
}

/**
 * Render en skjema-e-post (Skjemaer → «E-poster ved innsending») i Poynt-ramma.
 * Brukes av beforeEmail-kroken i payload.config og av forhåndsvisningen i
 * admin, slik at det partneren setter opp selv ser ut som resten av e-postene.
 */
export async function renderFormEmailHtml(params: {
  preview: string;
  contentHtml: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: FormEmail } = await import("./templates/form-email");
  return render(FormEmail(params));
}

/**
 * Send en testversjon av nyhetsbrevet til én adresse (vanlig e-post, ikke
 * broadcast). Avmeldingslenken peker på "#" siden Resend kun bytter ut
 * plassholderen ved ekte broadcasts.
 */
export async function sendNewsletterTest(params: {
  to: string;
  subject: string;
  preview: string;
  contentHtml: string;
}) {
  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "#",
  });

  await sendEmail({
    from: buildFrom("Poynt"),
    to: params.to,
    subject: `[TEST] ${params.subject}`,
    html,
  });
}

/**
 * Målet for nyhetsbrev-broadcasts. Nyere Resend-kontoer har innebygde
 * segmenter — da slår vi opp standard-segmentet automatisk, og ingen env
 * trengs. RESEND_AUDIENCE_ID beholdes som overstyring for eldre kontoer
 * (audienceId er deprecated hos Resend til fordel for segmentId).
 * Returnerer null hvis ingen målgruppe finnes (eller API-et feiler).
 */
export async function resolveBroadcastTarget(): Promise<
  { audienceId: string } | { segmentId: string } | null
> {
  const configured = process.env.RESEND_AUDIENCE_ID;
  if (configured) return { audienceId: configured };

  try {
    const segments = await getResend().segments.list();
    const first = segments.data?.data?.[0];
    return first ? { segmentId: first.id } : null;
  } catch (error) {
    console.error("Klarte ikke hente Resend-segmenter:", error);
    return null;
  }
}

/**
 * Opprett og send nyhetsbrevet som en Resend Broadcast til hele lista
 * (standard-segmentet, ev. RESEND_AUDIENCE_ID for eldre kontoer). Resend
 * håndterer avmelding per mottaker via `{{{RESEND_UNSUBSCRIBE_URL}}}`-
 * plassholderen i malen.
 */
export async function sendNewsletterBroadcast(params: {
  subject: string;
  preview: string;
  contentHtml: string;
}): Promise<{ broadcastId: string }> {
  const target = await resolveBroadcastTarget();
  if (!target) {
    throw new Error(
      "Fant ingen mottakerliste i Resend — sjekk at kontoen har et segment (eller sett RESEND_AUDIENCE_ID)"
    );
  }

  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  const created = await getResend().broadcasts.create({
    ...target,
    from: buildFrom("Poynt"),
    subject: params.subject,
    html,
    name: params.subject,
  });
  if (created.error || !created.data) {
    throw new Error(
      `Kunne ikke opprette broadcast: ${created.error?.message ?? "ukjent feil"}`
    );
  }

  const sent = await getResend().broadcasts.send(created.data.id);
  if (sent.error) {
    throw new Error(
      `Kunne ikke sende broadcast: ${sent.error.message ?? "ukjent feil"}`
    );
  }

  return { broadcastId: created.data.id };
}

/**
 * Send branded contact emails when the contact form is submitted: a notification
 * to Poynt (set CONTACT_EMAIL) and a confirmation to the sender. No-ops if
 * RESEND_API_KEY is missing. Uses React Email templates for proper design.
 */
export async function sendContactEmails(params: {
  /** Varsel-mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  /** Intern sporing: lesbar kilde-etikett (f.eks. "tjeneste:radgivning"). */
  source?: string;
  /** Intern sporing: stien brukeren sto på da skjemaet ble åpnet. */
  sourcePath?: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: ContactNotificationEmail } = await import(
    "./templates/contact-notification"
  );
  const { default: ContactConfirmationEmail } = await import(
    "./templates/contact-confirmation"
  );

  const from = buildFrom("Poynt");

  const wildcardValues = {
    navn: params.name,
    epost: params.email,
    telefon: params.phone,
    gjelder: params.subject,
    melding: params.message,
    kilde: params.source,
  };

  const notifyTo = resolveNotifyTo(params.to);
  if (notifyTo) {
    const template = applyTemplate(
      await getTemplateOverride("contact-notification"),
      wildcardValues
    );
    const html = await render(
      ContactNotificationEmail({ ...params, introHtml: template.contentHtml })
    );
    await sendEmail({
      from,
      to: notifyTo,
      replyTo: params.email,
      subject: template.subject || `Ny henvendelse fra ${params.name}`,
      html,
    });
  }

  const confirmationTemplate = applyTemplate(
    await getTemplateOverride("contact-confirmation"),
    wildcardValues
  );
  const confirmationHtml = await render(
    ContactConfirmationEmail({
      name: params.name,
      message: params.message,
      contentHtml: confirmationTemplate.contentHtml,
    })
  );
  await sendEmail({
    from,
    to: params.email,
    subject: confirmationTemplate.subject || "Takk for din henvendelse – Poynt",
    html: confirmationHtml,
  });
}

/**
 * Send e-postene som hører til en venteliste-påmelding: en branded bekreftelse
 * til den som meldte seg på, og et kort varsel til Poynt (CONTACT_EMAIL).
 * Har skjemaet en egen bekreftelse under «E-poster ved innsending», sender
 * form-builder-pluginen den i stedet — sett da `skipConfirmation` slik at den
 * påmeldte ikke får to bekreftelser. No-op hvis RESEND_API_KEY mangler.
 */
export async function sendWaitlistEmails(params: {
  /** Varsel-mottakere — overstyrer CONTACT_EMAIL (fra admin-innstillingen). */
  to?: string | string[];
  email: string;
  name?: string;
  /** Boka/produktet det ventes på — brukes i emne og brødtekst. */
  title: string;
  /** Om personen samtidig meldte seg på nyhetsbrevet. */
  newsletter?: boolean;
  /** Antall påmeldte totalt — tas med i varselet til Poynt. */
  totalSignups?: number;
  /** Hopp over bekreftelsen til den påmeldte (skjemaet har sin egen). */
  skipConfirmation?: boolean;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");

  const from = buildFrom("Poynt");

  if (!params.skipConfirmation) {
    const { default: WaitlistConfirmationEmail } = await import(
      "./templates/waitlist-confirmation"
    );
    const confirmationHtml = await render(
      WaitlistConfirmationEmail({
        name: params.name,
        title: params.title,
        newsletter: params.newsletter,
      })
    );
    await sendEmail({
      from,
      to: params.email,
      subject: `Du står på ventelista for «${params.title}»`,
      html: confirmationHtml,
    });
  }

  const notifyTo = resolveNotifyTo(params.to);
  if (notifyTo) {
    const { default: ContactNotificationEmail } = await import(
      "./templates/contact-notification"
    );
    const details = [
      `Venteliste: ${params.title}`,
      `Nyhetsbrev: ${params.newsletter ? "ja" : "nei"}`,
      params.totalSignups ? `Antall påmeldte nå: ${params.totalSignups}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const notificationHtml = await render(
      ContactNotificationEmail({
        name: params.name || params.email,
        email: params.email,
        subject: "Venteliste",
        message: details,
      })
    );
    await sendEmail({
      from,
      to: notifyTo,
      replyTo: params.email,
      subject: `Ny på ventelista: ${params.name || params.email}`,
      html: notificationHtml,
    });
  }
}

/**
 * Send branded welcome email to new member with On Poynt onboarding link.
 * Uses React Email template for better rendering across email clients.
 */
export async function sendMemberWelcomeEmail(params: {
  email: string;
  memberName: string;
  tier: "Community" | "Community + AI";
}) {
  if (!process.env.RESEND_API_KEY) return;

  const { render } = await import("@react-email/render");
  const { default: WelcomeMemberEmail } = await import(
    "./templates/welcome-member"
  );

  const onboardingUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/onboarding`;

  const template = applyTemplate(await getTemplateOverride("welcome-member"), {
    navn: params.memberName,
    nivå: params.tier,
    niva: params.tier,
  });

  const emailHtml = await render(
    WelcomeMemberEmail({
      memberName: params.memberName,
      tier: params.tier,
      onboardingUrl,
      contentHtml: template.contentHtml,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: template.subject || "Velkommen til On Poynt!",
    html: emailHtml,
  });
}
