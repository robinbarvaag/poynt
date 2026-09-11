import config from "@/payload.config";
import { getPayload } from "payload";
import { parseNotificationEmails } from "./parse-notification-emails";

export { parseNotificationEmails };

/**
 * Hvem som skal ha interne varsler (salg, påmeldinger, henvendelser).
 * Leses fra «Nettsted-innstillinger» i admin (kommaseparert felt), med
 * CONTACT_EMAIL-miljøvariabelen som fallback. Returnerer tom liste hvis
 * ingenting er satt — varsel-funksjonene i @poynt/email no-oper da.
 * Ugyldige adresser hoppes over med en advarsel i loggen, slik at én
 * skrivefeil ikke stopper utsendingen til de andre.
 */
export async function getNotificationEmails(): Promise<string[]> {
  let configured: string | null | undefined;
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "site-settings" });
    configured = settings?.notificationEmails;
  } catch (error) {
    console.error("Klarte ikke hente varslings-e-poster fra admin:", error);
  }

  const { valid, invalid } = parseNotificationEmails(
    configured || process.env.CONTACT_EMAIL || ""
  );
  if (invalid.length > 0) {
    console.warn(
      `Ugyldige varslingsadresser ignorert (rett dem under Drift → E-post): ${invalid.join(", ")}`
    );
  }
  return valid;
}
