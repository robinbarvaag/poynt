import config from "@/payload.config";
import {
  sendNewsletterSignupNotification,
  subscribeToNewsletter,
} from "@poynt/email";
import { getPayload } from "payload";
import {
  NEWSLETTER_CONSENT_SOURCES,
  type NewsletterConsentSource,
} from "./newsletter-consent-texts";
import { getNotificationEmails } from "./notification-emails";

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
  name,
}: {
  email: string;
  source: NewsletterConsentSource;
  consentText: string;
  path?: string;
  reference?: string | number;
  /** Fullt navn når vi har det (utsjekk, event, venteliste) — lagres i Resend. */
  name?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  const payload = await getPayload({ config });
  const sourceLabel =
    NEWSLETTER_CONSENT_SOURCES.find((s) => s.value === source)?.label ?? source;

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

  // Navn deles i fornavn/etternavn slik Resend lagrer det.
  const [firstName, ...rest] = (name ?? "").trim().split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ") || undefined;

  const result: Awaited<ReturnType<typeof subscribeToNewsletter>> =
    await subscribeToNewsletter(normalized, {
      source: sourceLabel,
      path,
      firstName,
      lastName,
    }).catch((error: unknown) => ({
      success: false,
      error: String(error),
    }));

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

  // Internt varsel for ALLE påmeldingsveier (skjema, boktilgang, utsjekk …),
  // men ikke når adressen allerede var abonnent — det er ingen ny påmelding.
  // Aldri la varselet velte selve påmeldingen.
  if (result.success && !result.alreadySubscribed) {
    try {
      await sendNewsletterSignupNotification({
        to: await getNotificationEmails(),
        email: normalized,
        source: sourceLabel,
      });
    } catch (error) {
      console.error("Nyhetsbrev-varsel feilet:", error);
    }
  }

  return result;
}
