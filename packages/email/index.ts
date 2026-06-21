import { Resend } from "resend";
import type { OrderConfirmationItem } from "./templates/order-confirmation";

export type { OrderConfirmationItem };

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

export async function sendOrderConfirmation(params: {
  email: string;
  orderNumber: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr. */
  total: number;
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
    })
  );

  await getResend().emails.send({
    from: "Poynt <onboarding@resend.dev>", // TODO: bytt til verifisert domene
    to: params.email,
    subject: `Ordrebekreftelse #${params.orderNumber}`,
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

  const html = await render(
    MagicLinkEmail({
      url: params.url,
      expiresInMinutes: params.expiresInMinutes,
    })
  );

  await getResend().emails.send({
    from: "On Poynt <onboarding@resend.dev>", // TODO: bytt til verifisert domene
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
      // Handle "already exists" as success
      if (result.error.message?.includes("already exists")) {
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

  const resendClient = getResend();
  // TODO: bytt til verifisert avsender-domene (onboarding@resend.dev kan i
  // test-modus kun levere til Resend-kontoens egen adresse).
  const from = "Poynt <onboarding@resend.dev>";

  const notifyTo = process.env.CONTACT_EMAIL;
  if (notifyTo) {
    const html = await render(ContactNotificationEmail(params));
    await resendClient.emails.send({
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
  await resendClient.emails.send({
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

  await getResend().emails.send({
    from: "On Poynt <onboarding@resend.dev>", // TODO: Change to verified domain
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

  await getResend().emails.send({
    from: "On Poynt <velkommen@resend.dev>", // TODO: Change to verified domain
    to: params.email,
    subject: "Velkommen til On Poynt!",
    html: emailHtml,
  });
}
