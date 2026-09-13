import config from "@/payload.config";
import { subscribeToNewsletter } from "@poynt/email";
import { getPayload } from "payload";
import type { NewsletterConsentSource } from "./newsletter-consent-texts";

/**
 * ENESTE vei inn på nyhetsbrevet: logger samtykket i «newsletter-consents»
 * og melder på i Resend. Loggen skrives først — samtykket er gitt uansett om
 * Resend svarer — og markeres `subscribed` når påmeldingen gikk gjennom.
 * Feil i loggingen velter aldri påmeldingen (og omvendt).
 */
export async function subscribeWithConsent({
  email,
  source,
  consentText,
  path,
  reference,
}: {
  email: string;
  source: NewsletterConsentSource;
  consentText: string;
  path?: string;
  reference?: string | number;
}): Promise<{ success: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const payload = await getPayload({ config });

  const logId = await payload
    .create({
      collection: "newsletter-consents",
      data: {
        email: normalized,
        source,
        consentText,
        path: path?.slice(0, 500) || undefined,
        reference: reference != null ? String(reference) : undefined,
        subscribed: false,
      },
      overrideAccess: true,
    })
    .then((doc) => doc.id)
    .catch((error: unknown) => {
      console.error("Kunne ikke logge nyhetsbrev-samtykke:", error);
      return null;
    });

  const result = await subscribeToNewsletter(normalized).catch(
    (error: unknown) => ({ success: false, error: String(error) })
  );

  if (result.success && logId != null) {
    await payload
      .update({
        collection: "newsletter-consents",
        id: logId,
        data: { subscribed: true },
        overrideAccess: true,
      })
      .catch((error: unknown) => {
        console.error("Kunne ikke oppdatere samtykkelogg:", error);
      });
  }

  return result;
}
