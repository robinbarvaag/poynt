import config from "@/payload.config";
import { getPayload } from "payload";

/**
 * Hvem som skal ha interne varsler (salg, påmeldinger, henvendelser).
 * Leses fra «Nettsted-innstillinger» i admin (kommaseparert felt), med
 * CONTACT_EMAIL-miljøvariabelen som fallback. Returnerer tom liste hvis
 * ingenting er satt — varsel-funksjonene i @poynt/email no-oper da.
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

  const raw = configured || process.env.CONTACT_EMAIL || "";
  return raw
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}
