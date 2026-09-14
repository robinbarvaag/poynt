/**
 * Kapasitet, venteliste og påmeldingsvindu for eventer. Ren logikk — selve
 * låsingen og tellingen mot databasen skjer i lib/events/registrations.ts.
 */

export const REGISTRATION_STATUSES = [
  { value: "registered", label: "Påmeldt" },
  { value: "waitlisted", label: "På venteliste" },
  { value: "checked_in", label: "Møtt" },
  { value: "cancelled", label: "Avmeldt" },
  { value: "pending_payment", label: "Venter på betaling" },
  { value: "refunded", label: "Refundert" },
] as const;

export type RegistrationStatus =
  (typeof REGISTRATION_STATUSES)[number]["value"];

/**
 * Statusene som tar en plass. `pending_payment` holder av plassen mens
 * personen betaler (til betalingen utløper, se lib/events/payments.ts).
 */
export const SEAT_STATUSES: RegistrationStatus[] = [
  "registered",
  "checked_in",
  "pending_payment",
];

/** Statusene som er en gyldig billett (kan sjekkes inn, får påminnelse). */
export const TICKET_STATUSES: RegistrationStatus[] = [
  "registered",
  "checked_in",
];

export const REGISTRATION_SOURCES = [
  { value: "online", label: "Påmelding på nettsiden" },
  { value: "walk_in", label: "Registrert på stedet" },
] as const;

export type RegistrationSource = (typeof REGISTRATION_SOURCES)[number]["value"];

export function statusLabel(status: string | null | undefined): string {
  return (
    REGISTRATION_STATUSES.find((s) => s.value === status)?.label ?? status ?? ""
  );
}

export type RegistrationDecision = "registered" | "waitlisted" | "full";

/**
 * Hvor skal en ny påmelding havne? `capacity` tom/0 = ubegrenset.
 * `seatsTaken` er antall påmeldinger som tar en plass (SEAT_STATUSES).
 */
export function decideRegistrationStatus({
  capacity,
  seatsTaken,
  waitlistEnabled,
}: {
  capacity?: number | null;
  seatsTaken: number;
  waitlistEnabled?: boolean | null;
}): RegistrationDecision {
  if (!capacity || capacity <= 0 || seatsTaken < capacity) return "registered";
  return waitlistEnabled ? "waitlisted" : "full";
}

/** Plasser igjen, eller null når eventet ikke har kapasitetsgrense. */
export function spotsLeft(
  capacity: number | null | undefined,
  seatsTaken: number
): number | null {
  if (!capacity || capacity <= 0) return null;
  return Math.max(0, capacity - seatsTaken);
}

export type RegistrationWindow =
  | "open"
  | "not_open" // påmeldingen har ikke åpnet ennå
  | "closed" // fristen har gått ut
  | "ended"; // eventet har startet/er over

/** Er påmeldingen åpen akkurat nå? */
export function registrationWindow(
  event: {
    startsAt?: string | null;
    registrationOpensAt?: string | null;
    registrationClosesAt?: string | null;
  },
  now: Date = new Date()
): RegistrationWindow {
  const time = now.getTime();
  const at = (value?: string | null) =>
    value ? new Date(value).getTime() : Number.NaN;

  if (time >= at(event.startsAt)) return "ended";
  if (time < at(event.registrationOpensAt)) return "not_open";
  if (time >= at(event.registrationClosesAt)) return "closed";
  return "open";
}
