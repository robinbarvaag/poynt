import { Resend } from "resend";
import type {
  OrderConfirmationContent,
  OrderConfirmationItem,
} from "./templates/order-confirmation";

export type { OrderConfirmationContent, OrderConfirmationItem };

export interface EmailAttachment {
  filename: string;
  /** Filinnhold, base64-kodet. */
  content: string;
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

  const html = await render(
    MagicLinkEmail({
      url: params.url,
      expiresInMinutes: params.expiresInMinutes,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: "Logg inn på On Poynt",
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

  return render(PasswordResetEmail({ url: params.url, name: params.name }));
}

/**
 * Subscribe an email to the newsletter audience in Resend
 */
export async function subscribeToNewsletter(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY is not configured" };
  }

  if (!audienceId) {
    return { success: false, error: "RESEND_AUDIENCE_ID is not configured" };
  }

  try {
    const result = await getResend().contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });

    if (result.error) {
      // Kontakten finnes fra før — kan være avmeldt, så re-abonner eksplisitt
      // (contacts.create setter aldri unsubscribed tilbake til false).
      if (result.error.message?.includes("already exists")) {
        const update = await getResend().contacts.update({
          audienceId,
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

async function renderNewsletterHtml(params: {
  preview: string;
  contentHtml: string;
  unsubscribeUrl: string;
}): Promise<string> {
  const { render } = await import("@react-email/render");
  const { default: NewsletterEmail } = await import("./templates/newsletter");
  return render(NewsletterEmail(params));
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
 * Opprett og send nyhetsbrevet som en Resend Broadcast til hele audiencen
 * (RESEND_AUDIENCE_ID). Resend håndterer avmelding per mottaker via
 * `{{{RESEND_UNSUBSCRIBE_URL}}}`-plassholderen i malen.
 */
export async function sendNewsletterBroadcast(params: {
  subject: string;
  preview: string;
  contentHtml: string;
}): Promise<{ broadcastId: string }> {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    throw new Error(
      "RESEND_AUDIENCE_ID er ikke satt — opprett en Audience i Resend-dashboardet først"
    );
  }

  const html = await renderNewsletterHtml({
    preview: params.preview,
    contentHtml: params.contentHtml,
    unsubscribeUrl: "{{{RESEND_UNSUBSCRIBE_URL}}}",
  });

  const created = await getResend().broadcasts.create({
    audienceId,
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

  const notifyTo = process.env.CONTACT_EMAIL;
  if (notifyTo) {
    const html = await render(ContactNotificationEmail(params));
    await sendEmail({
      from,
      to: notifyTo,
      replyTo: params.email,
      subject: `Ny henvendelse fra ${params.name}`,
      html,
    });
  }

  const confirmationHtml = await render(
    ContactConfirmationEmail({ name: params.name, message: params.message })
  );
  await sendEmail({
    from,
    to: params.email,
    subject: "Takk for din henvendelse – Poynt",
    html: confirmationHtml,
  });
}

/**
 * Send welcome email to new member with magic link login.
 * @deprecated Use sendMemberWelcomeEmail for membership subscriptions
 */
export async function sendWelcomeEmail(email: string, magicLinkUrl: string) {
  if (!process.env.RESEND_API_KEY) return;

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: email,
    subject: "Velkommen til On Poynt!",
    html: `
      <h1>Velkommen til On Poynt!</h1>
      <p>Takk for at du ble medlem. Du har nå tilgang til On Poynt-plattformen.</p>
      <p>Klikk på lenken under for å komme i gang:</p>
      <p><a href="${magicLinkUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Gå til On Poynt</a></p>
      <p style="color:#666;font-size:12px;">Denne lenken utløper om 10 minutter.</p>
    `,
  });
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

  const emailHtml = await render(
    WelcomeMemberEmail({
      memberName: params.memberName,
      tier: params.tier,
      onboardingUrl,
    })
  );

  await sendEmail({
    from: buildFrom("On Poynt"),
    to: params.email,
    subject: "Velkommen til On Poynt!",
    html: emailHtml,
  });
}
