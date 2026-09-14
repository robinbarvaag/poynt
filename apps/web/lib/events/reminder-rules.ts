/**
 * Når påminnelsen før et event sendes. Ren logikk (testet i
 * events.test.ts); selve utsendingen ligger i reminders.ts.
 */

const HOUR_MS = 60 * 60 * 1000;

/** Påminnelsen går ut når eventet er under så mange timer unna. */
export const REMINDER_HOURS_BEFORE = 24;
/** Nærmere enn dette er det for sent å minne på (og døra er snart åpen). */
export const REMINDER_MIN_HOURS_BEFORE = 2;
/** Den som fikk billetten nylig, har den friskt i minne — ingen påminnelse. */
export const REMINDER_SKIP_RECENT_HOURS = 12;

/** Eventer som starter i dette tidsrommet, skal ha påminnelse nå. */
export function reminderWindow(now: Date = new Date()): {
  from: Date;
  to: Date;
} {
  return {
    from: new Date(now.getTime() + REMINDER_MIN_HOURS_BEFORE * HOUR_MS),
    to: new Date(now.getTime() + REMINDER_HOURS_BEFORE * HOUR_MS),
  };
}

/**
 * Fikk personen billetten for kort tid siden (påmeldt, rykket opp eller
 * betalt)? Da hoppes påminnelsen over.
 */
export function gotTicketRecently(
  registration: {
    createdAt: string;
    promotedAt?: string | null;
    paidAt?: string | null;
  },
  now: Date = new Date()
): boolean {
  const latest = Math.max(
    ...[registration.createdAt, registration.promotedAt, registration.paidAt]
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
  );
  return now.getTime() - latest < REMINDER_SKIP_RECENT_HOURS * HOUR_MS;
}
