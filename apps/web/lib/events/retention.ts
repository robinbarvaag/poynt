/**
 * Hvor lenge påmeldinger til eventer lagres (personvern). Ren logikk uten
 * Payload, så den kan testes og brukes i admin-UI-et.
 *
 * - Svar på ekstra spørsmål (f.eks. allergier, som kan være
 *   helseopplysninger) slettes `ANSWERS_RETENTION_DAYS` etter at eventet er
 *   ferdig — de trengs bare for å tilrettelegge selve eventet.
 * - Resten anonymiseres `REGISTRATION_RETENTION_MONTHS` etter: navn, e-post,
 *   kode og billettnøkkel erstattes, så bare tellerne (hvor mange som meldte
 *   seg på, sto på venteliste og kom) blir igjen.
 *
 * Endres fristene her, må personvernerklæringen og teksten i
 * påmeldingsskjemaet oppdateres samtidig (se docs/EVENTER.md § 8).
 */

export const ANSWERS_RETENTION_DAYS = 14;
export const REGISTRATION_RETENTION_MONTHS = 6;

/** `.invalid` er reservert og kan aldri bli en ekte e-postadresse. */
export const ANONYMIZED_EMAIL_DOMAIN = "slettet.invalid";
export const ANONYMIZED_NAME = "Slettet";

export type RetentionAction = "keep" | "clear_answers" | "anonymize";

interface EventDates {
  startsAt: string;
  endsAt?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Når eventet er ferdig: sluttid, eller starttid hvis sluttid mangler. */
export function eventEndedAt(event: EventDates): Date {
  return new Date(event.endsAt || event.startsAt);
}

/** Legg til måneder uten å hoppe over månedsslutt (31. aug + 6 mnd = 28./29. feb). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function answersDeleteAt(event: EventDates): Date {
  return new Date(
    eventEndedAt(event).getTime() + ANSWERS_RETENTION_DAYS * DAY_MS
  );
}

export function registrationsAnonymizeAt(event: EventDates): Date {
  return addMonths(eventEndedAt(event), REGISTRATION_RETENTION_MONTHS);
}

/** Hva som skal skje med påmeldingene til et event nå. Ugyldig dato → behold. */
export function retentionAction(
  event: EventDates,
  now: Date = new Date()
): RetentionAction {
  if (now >= registrationsAnonymizeAt(event)) return "anonymize";
  if (now >= answersDeleteAt(event)) return "clear_answers";
  return "keep";
}

/** Siste dag et event kan ha startet for å være aktuelt for rydding nå. */
export function retentionCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - ANSWERS_RETENTION_DAYS * DAY_MS);
}

export function isAnonymizedEmail(email: string): boolean {
  return email.endsWith(`@${ANONYMIZED_EMAIL_DOMAIN}`);
}

/** Erstatningsverdier for en anonymisert påmelding (unike per rad). */
export function anonymizedIdentity(registrationId: number) {
  return {
    name: ANONYMIZED_NAME,
    email: `pamelding-${registrationId}@${ANONYMIZED_EMAIL_DOMAIN}`,
    code: `SLETTET-${registrationId}`,
  };
}

export function hasAnswers(answers: unknown): boolean {
  return (
    typeof answers === "object" &&
    answers !== null &&
    Object.keys(answers).length > 0
  );
}
