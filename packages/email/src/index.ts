import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(email: string, orderId: string) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: "Poynt <onboarding@resend.dev>", // Change to verified domain later
    to: email,
    subject: `Ordrebekreftelse #${orderId}`,
    html: `<p>Takk for din bestilling!</p>`,
  });
}
