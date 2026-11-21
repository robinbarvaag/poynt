import { events, inngest } from "@/lib/inngest/client";
import type { EventRegistration } from "@/payload-types";

/**
 * Planlegg oppryddingen for plasser som nettopp ble holdt av til betaling.
 * Inngest-funksjonen `event-payments` sover til fristen og rydder da — slik
 * slipper vi å spørre databasen hvert 5. minutt (det holdt Neon våken hele
 * døgnet). Kalles ETTER at transaksjonen er fullført.
 *
 * Feiler sendingen, går påmeldingen likevel gjennom: sikkerhetsnettet (samme
 * funksjon, én gang i timen) plukker opp plassen.
 */
export async function schedulePaymentChecks(
  registrations: (EventRegistration | null | undefined)[]
): Promise<void> {
  const deadlines = new Set<string>();
  for (const registration of registrations) {
    const expiresAt = registration?.payment?.expiresAt;
    if (registration?.status === "pending_payment" && expiresAt) {
      deadlines.add(expiresAt);
    }
  }
  if (!deadlines.size) return;

  try {
    await inngest.send(
      [...deadlines].map((expiresAt) =>
        events.eventsPaymentHoldStarted.create({ expiresAt })
      )
    );
  } catch (error) {
    console.warn(
      "Kunne ikke planlegge betalingssjekk (tas av timesjekken):",
      error instanceof Error ? error.message : error
    );
  }
}
