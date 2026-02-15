import { Resend } from "resend";

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

export async function sendOrderConfirmation(email: string, orderId: string) {
  if (!process.env.RESEND_API_KEY) return;

  await getResend().emails.send({
    from: "Poynt <onboarding@resend.dev>", // Change to verified domain later
    to: email,
    subject: `Ordrebekreftelse #${orderId}`,
    html: `<p>Takk for din bestilling!</p>`,
  });
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
