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
