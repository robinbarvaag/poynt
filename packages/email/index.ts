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
