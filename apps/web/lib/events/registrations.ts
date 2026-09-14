import type { Event, EventRegistration } from "@/payload-types";
import config from "@/payload.config";
import { sql } from "@payloadcms/db-postgres";
import { revalidateTag } from "next/cache";
import { type Payload, type PayloadRequest, getPayload } from "payload";
import {
  type RegistrationSource,
  type RegistrationStatus,
  SEAT_STATUSES,
  decideRegistrationStatus,
  registrationWindow,
  sanitizeGuestNames,
} from "./capacity";
import {
  generateTicketCode,
  generateTicketToken,
  normalizeTicketCode,
} from "./codes";

/**
 * All skriving av påmeldinger går hit: påmelding, avmelding, opprykk fra
 * venteliste og innsjekk. Alt som teller plasser skjer inne i en
 * database-transaksjon med en lås per event (pg_advisory_xact_lock), så to
 * samtidige påmeldinger aldri kan ta den siste plassen begge to — heller ikke
 * når Vercel kjører flere instanser.
 *
 * Funksjonene her sender IKKE e-post. De returnerer det som skjedde, og
 * kalleren (API-rutene) sender e-post via lib/events/notify.ts etter at
 * transaksjonen er fullført — en treg e-posttjeneste skal aldri holde låsen.
 */

/** Fast «navnerom» for event-låsene, så de ikke kolliderer med andre låser. */
const LOCK_NAMESPACE = 7401;

type LockedReq = Partial<PayloadRequest>;

interface DrizzleSession {
  db: { execute: (query: ReturnType<typeof sql>) => Promise<unknown> };
}

export async function getEventsPayload(): Promise<Payload> {
  return getPayload({ config });
}

async function withEventLock<T>(
  payload: Payload,
  eventId: number,
  fn: (req: LockedReq) => Promise<T>
): Promise<T> {
  const transactionID = await payload.db.beginTransaction();
  if (!transactionID) {
    // Adapteren støtter ikke transaksjoner (skjer ikke med Postgres).
    return fn({});
  }
  try {
    const sessions = (
      payload.db as unknown as { sessions: Record<string, DrizzleSession> }
    ).sessions;
    await sessions[String(transactionID)].db.execute(
      sql`select pg_advisory_xact_lock(${LOCK_NAMESPACE}, ${eventId})`
    );
    const result = await fn({ transactionID });
    await payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await payload.db.rollbackTransaction(transactionID);
    throw error;
  }
}

/** Tøm cachen for plass-telleren på eventsiden. */
export function revalidateEventSeats(eventId: number): void {
  try {
    revalidateTag(`event-${eventId}`, "max");
  } catch {
    // Utenfor Next-kontekst (seed-script) — cachen utløper selv.
  }
}

function relationId(value: number | { id: number } | null | undefined) {
  return typeof value === "object" && value ? value.id : (value ?? null);
}

async function countSeats(
  payload: Payload,
  eventId: number,
  req: LockedReq
): Promise<number> {
  const { totalDocs } = await payload.count({
    collection: "event-registrations",
    where: {
      event: { equals: eventId },
      status: { in: SEAT_STATUSES },
    },
    req,
  });
  return totalDocs;
}

async function nextWaitlistPosition(
  payload: Payload,
  eventId: number,
  req: LockedReq
): Promise<number> {
  const last = await payload.find({
    collection: "event-registrations",
    where: {
      event: { equals: eventId },
      status: { equals: "waitlisted" },
    },
    sort: "-waitlistPosition",
    limit: 1,
    depth: 0,
    req,
  });
  return (last.docs[0]?.waitlistPosition ?? 0) + 1;
}

async function uniqueCode(payload: Payload, req: LockedReq): Promise<string> {
  // En unik-feil midt i en transaksjon ville avbrutt hele transaksjonen, så
  // vi sjekker før vi skriver. Med 32^4 mulige koder er kollisjon sjelden.
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateTicketCode();
    const { totalDocs } = await payload.count({
      collection: "event-registrations",
      where: { code: { equals: code } },
      req,
    });
    if (totalDocs === 0) return code;
  }
  throw new Error("Fant ingen ledig billettkode etter 10 forsøk");
}

/* ------------------------------------------------------------------ */
/* Påmelding                                                          */
/* ------------------------------------------------------------------ */

export type ExtraQuestion = NonNullable<Event["extraQuestions"]>[number];

export type RegistrationAnswers = Record<string, string | boolean>;

/**
 * Validerer svarene på ekstra spørsmål mot eventets oppsett. Ukjente felt
 * kastes, lange svar kuttes, og påkrevde spørsmål må være besvart.
 */
export function sanitizeAnswers(
  questions: ExtraQuestion[] | null | undefined,
  raw: Record<string, unknown>
): { answers: RegistrationAnswers; missing: string[] } {
  const answers: RegistrationAnswers = {};
  const missing: string[] = [];

  for (const question of questions ?? []) {
    if (!question.name) continue;
    const value = raw[question.name];

    if (question.type === "checkbox") {
      const checked =
        value === true ||
        (typeof value === "string" &&
          ["on", "true", "1", "ja"].includes(value.toLowerCase()));
      answers[question.name] = checked;
      if (question.required && !checked) missing.push(question.label);
      continue;
    }

    let text = typeof value === "string" ? value.trim().slice(0, 2000) : "";
    if (
      question.type === "select" &&
      text &&
      !(question.options ?? []).includes(text)
    ) {
      text = "";
    }
    if (text) answers[question.name] = text;
    if (question.required && !text) missing.push(question.label);
  }

  return { answers, missing };
}

export type RegisterError =
  | "not_found"
  | "not_internal"
  | "event_cancelled"
  | "not_open"
  | "closed"
  | "ended"
  | "full"
  | "invalid";

export type RegisterResult =
  | {
      ok: true;
      registration: EventRegistration;
      event: Event;
      /** Personen var allerede påmeldt — vi sender billetten på nytt. */
      alreadyRegistered: boolean;
      /** Følget, hvis personen tok med noen. */
      guests: EventRegistration[];
    }
  | { ok: false; error: RegisterError; message: string };

const REGISTER_MESSAGES: Record<RegisterError, string> = {
  not_found: "Fant ikke eventet.",
  not_internal: "Påmeldingen til dette eventet skjer et annet sted.",
  event_cancelled: "Eventet er avlyst eller utsatt, så påmeldingen er stengt.",
  not_open: "Påmeldingen har ikke åpnet ennå.",
  closed: "Påmeldingsfristen har gått ut.",
  ended: "Eventet har allerede startet.",
  full: "Det er dessverre fullt.",
  invalid: "Noe mangler i skjemaet.",
};

const fail = (error: RegisterError, message?: string): RegisterResult => ({
  ok: false,
  error,
  message: message ?? REGISTER_MESSAGES[error],
});

export async function registerForEvent(input: {
  eventId: number;
  name: string;
  email: string;
  answers: Record<string, unknown>;
  newsletter: boolean;
  /** Navnene på følget (fra skjemaet, valideres her). */
  guests?: unknown;
}): Promise<RegisterResult> {
  const payload = await getEventsPayload();

  const event = await payload
    .findByID({ collection: "events", id: input.eventId, depth: 0 })
    .catch(() => null);
  if (!event || event._status !== "published") return fail("not_found");
  if ((event.registrationMode ?? "internal") !== "internal") {
    return fail("not_internal");
  }
  if (event.eventStatus && event.eventStatus !== "scheduled") {
    return fail("event_cancelled");
  }
  const window = registrationWindow(event);
  if (window !== "open") return fail(window);

  const name = input.name.trim().slice(0, 200);
  const email = input.email.trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("invalid", "Skriv inn navn og en gyldig e-postadresse.");
  }
  const { answers, missing } = sanitizeAnswers(
    event.extraQuestions,
    input.answers
  );
  if (missing.length) {
    return fail("invalid", `Svar på: ${missing.join(", ")}.`);
  }
  const guestNames = sanitizeGuestNames(input.guests, event.maxGuests);
  if (guestNames.error) return fail("invalid", guestNames.error);

  const result = await withEventLock(payload, event.id, async (req) => {
    const existing = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: event.id },
        email: { equals: email },
        status: { not_equals: "cancelled" },
      },
      limit: 1,
      depth: 0,
      req,
    });
    if (existing.docs[0]) {
      return {
        registration: existing.docs[0],
        guests: await findActiveGuests(payload, existing.docs[0].id, req),
        alreadyRegistered: true,
      };
    }

    const decision = decideRegistrationStatus({
      capacity: event.capacity,
      seatsTaken: await countSeats(payload, event.id, req),
      waitlistEnabled: event.waitlistEnabled,
      partySize: 1 + guestNames.names.length,
    });
    if (decision === "full") return null;

    const registration = await payload.create({
      collection: "event-registrations",
      data: {
        event: event.id,
        source: "online",
        name,
        email,
        answers,
        newsletter: input.newsletter && Boolean(event.newsletterOptIn),
        status: decision,
        code: await uniqueCode(payload, req),
        token: generateTicketToken(),
        waitlistPosition:
          decision === "waitlisted"
            ? await nextWaitlistPosition(payload, event.id, req)
            : undefined,
      },
      req,
    });

    // Følget: hver sin rad og kode, samme status som den som meldte på.
    // Uten e-post — billettene sendes til hovedpersonen.
    const guests: EventRegistration[] = [];
    for (const guestName of guestNames.names) {
      guests.push(
        await payload.create({
          collection: "event-registrations",
          data: {
            event: event.id,
            source: "online",
            guestOf: registration.id,
            name: guestName,
            status: decision,
            code: await uniqueCode(payload, req),
            token: generateTicketToken(),
          },
          req,
        })
      );
    }
    return { registration, guests, alreadyRegistered: false };
  });

  if (!result) {
    return fail(
      "full",
      guestNames.names.length
        ? "Det er ikke nok plasser til hele følget ditt. Prøv med færre personer."
        : undefined
    );
  }
  revalidateEventSeats(event.id);
  return { ok: true, event, ...result };
}

/* ------------------------------------------------------------------ */
/* Oppslag                                                            */
/* ------------------------------------------------------------------ */

/**
 * Hent en påmelding på billettnøkkelen, med nøkkelen og eventet inkludert.
 * `token`-feltet er skjult for API-et, men lesbart med overrideAccess.
 */
export async function findRegistrationByToken(
  token: string
): Promise<(EventRegistration & { event: Event }) | null> {
  const payload = await getEventsPayload();
  const found = await payload.find({
    collection: "event-registrations",
    where: { token: { equals: token } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  const registration = found.docs[0];
  if (!registration || typeof registration.event !== "object") return null;
  return registration as EventRegistration & { event: Event };
}

/** Følget til en påmelding (ikke avmeldte), med billettnøkler. */
export async function getActiveGuests(
  registrationId: number
): Promise<EventRegistration[]> {
  return findActiveGuests(await getEventsPayload(), registrationId);
}

async function findActiveGuests(
  payload: Payload,
  hostId: number,
  req: LockedReq = {}
): Promise<EventRegistration[]> {
  const { docs } = await payload.find({
    collection: "event-registrations",
    where: {
      guestOf: { equals: hostId },
      status: { not_equals: "cancelled" },
    },
    sort: "createdAt",
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  });
  return docs;
}

async function findRegistrationById(
  payload: Payload,
  id: number,
  req: LockedReq = {}
): Promise<EventRegistration | null> {
  return payload
    .findByID({
      collection: "event-registrations",
      id,
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null);
}

/* ------------------------------------------------------------------ */
/* Avmelding og venteliste                                            */
/* ------------------------------------------------------------------ */

export interface CancelResult {
  registration: EventRegistration;
  /** Følget som ble meldt av sammen med personen. */
  cancelledGuests: EventRegistration[];
  /**
   * De som rykket opp fra ventelista og nå skal ha billett (hovedpersonene —
   * følget deres rykket opp samtidig og får billettene i samme e-post).
   */
  promoted: EventRegistration[];
  alreadyCancelled: boolean;
}

/**
 * Meld av en påmelding. Tok den en plass, rykker den første på ventelista
 * opp — så lenge det faktisk er plass (kapasiteten kan ha blitt satt ned).
 */
export async function cancelRegistration({
  registrationId,
  by,
}: {
  registrationId: number;
  by: "self" | "admin";
}): Promise<CancelResult | null> {
  const payload = await getEventsPayload();
  const initial = await findRegistrationById(payload, registrationId);
  const eventId = relationId(initial?.event);
  if (!initial || !eventId) return null;

  const result = await withEventLock(payload, eventId, async (req) => {
    const current = await findRegistrationById(payload, registrationId, req);
    if (!current) return null;
    if (current.status === "cancelled") {
      return {
        registration: current,
        cancelledGuests: [],
        promoted: [],
        alreadyCancelled: true,
      };
    }

    const cancelData = {
      status: "cancelled" as const,
      cancelledAt: new Date().toISOString(),
      cancelledBy: by,
      waitlistPosition: null,
    };
    const registration = await payload.update({
      collection: "event-registrations",
      id: current.id,
      data: cancelData,
      depth: 0,
      overrideAccess: true,
      req,
    });

    // Melder hovedpersonen seg av, går følget med. Et følge kan også melde
    // seg av alene (fra sin egen billett).
    const guests = current.guestOf
      ? []
      : await findActiveGuests(payload, current.id, req);
    const cancelledGuests: EventRegistration[] = [];
    for (const guest of guests) {
      cancelledGuests.push(
        await payload.update({
          collection: "event-registrations",
          id: guest.id,
          data: cancelData,
          depth: 0,
          overrideAccess: true,
          req,
        })
      );
    }

    const freedSeat = [current, ...guests].some((doc) =>
      SEAT_STATUSES.includes(doc.status)
    );
    const promoted = freedSeat
      ? await promoteFromWaitlist(payload, eventId, req)
      : [];
    return {
      registration,
      cancelledGuests,
      promoted,
      alreadyCancelled: false,
    };
  });

  if (result) revalidateEventSeats(eventId);
  return result;
}

/** Flytt påmeldinger fra venteliste til plass. Returnerer de oppdaterte. */
async function markPromoted(
  payload: Payload,
  ids: number[],
  req: LockedReq
): Promise<EventRegistration[]> {
  const updated: EventRegistration[] = [];
  for (const id of ids) {
    updated.push(
      await payload.update({
        collection: "event-registrations",
        id,
        data: {
          status: "registered",
          promotedAt: new Date().toISOString(),
          waitlistPosition: null,
        },
        depth: 0,
        overrideAccess: true,
        req,
      })
    );
  }
  return updated;
}

/**
 * Gi plass til de første på ventelista, ett følge om gangen (personen og
 * følget får plass samtidig), så lenge det er plass. Stopper ved det første
 * følget som ikke får plass, så ingen sniker i køen — «Gi plass» i admin kan
 * overstyre.
 */
async function promoteFromWaitlist(
  payload: Payload,
  eventId: number,
  req: LockedReq
): Promise<EventRegistration[]> {
  const event = await payload.findByID({
    collection: "events",
    id: eventId,
    depth: 0,
    req,
  });
  if (!event.waitlistEnabled && !event.capacity) return [];

  const promoted: EventRegistration[] = [];
  for (;;) {
    const seatsTaken = await countSeats(payload, eventId, req);
    if (event.capacity && seatsTaken >= event.capacity) break;

    const next = await payload.find({
      collection: "event-registrations",
      where: {
        event: { equals: eventId },
        status: { equals: "waitlisted" },
        guestOf: { exists: false },
      },
      sort: ["waitlistPosition", "createdAt"],
      limit: 1,
      depth: 0,
      req,
    });
    const host = next.docs[0];
    if (!host) break;

    const guests = (await findActiveGuests(payload, host.id, req)).filter(
      (guest) => guest.status === "waitlisted"
    );
    if (event.capacity && seatsTaken + 1 + guests.length > event.capacity) {
      break;
    }
    const [updatedHost] = await markPromoted(
      payload,
      [host.id, ...guests.map((guest) => guest.id)],
      req
    );
    promoted.push(updatedHost);
  }
  return promoted;
}

/**
 * Admin flytter noen fra ventelista manuelt — også når det er fullt (dere
 * bestemmer selv om dere vil ta inn én til).
 */
export async function promoteRegistration(
  registrationId: number
): Promise<EventRegistration | null> {
  const payload = await getEventsPayload();
  const initial = await findRegistrationById(payload, registrationId);
  const eventId = relationId(initial?.event);
  if (!initial || !eventId || initial.status !== "waitlisted") return null;

  // Hele følget får plass sammen, uansett hvilken rad admin trykket på.
  const hostId = relationId(initial.guestOf) ?? initial.id;
  const updated = await withEventLock(payload, eventId, async (req) => {
    const host = await findRegistrationById(payload, hostId, req);
    const guests = (await findActiveGuests(payload, hostId, req)).filter(
      (guest) => guest.status === "waitlisted"
    );
    const ids = [
      ...(host?.status === "waitlisted" ? [hostId] : []),
      ...guests.map((guest) => guest.id),
    ];
    const docs = await markPromoted(payload, ids, req);
    return (
      docs.find((doc) => doc.id === hostId) ??
      (await findRegistrationById(payload, hostId, req))
    );
  });
  revalidateEventSeats(eventId);
  return updated;
}

/* ------------------------------------------------------------------ */
/* Innsjekk                                                           */
/* ------------------------------------------------------------------ */

export type CheckInOutcome =
  | "ok"
  | "already"
  | "waitlisted"
  | "cancelled"
  | "unknown"
  | "wrong_event";

export interface CheckInResult {
  outcome: CheckInOutcome;
  registration?: {
    id: number;
    name: string;
    code: string;
    status: RegistrationStatus;
    checkedInAt?: string | null;
    eventId: number;
    eventTitle?: string;
  };
}

/**
 * Sjekk inn på billettnøkkel (QR) eller kode (tastet inn). `force` slipper inn
 * noen som står på venteliste eller er avmeldt («Slipp inn likevel»).
 */
export async function checkInRegistration({
  token,
  code,
  eventId,
  userId,
  force = false,
}: {
  token?: string | null;
  code?: string | null;
  eventId?: number | null;
  userId: number;
  force?: boolean;
}): Promise<CheckInResult> {
  const payload = await getEventsPayload();
  const normalizedCode = code ? normalizeTicketCode(code) : null;
  if (!token && !normalizedCode) return { outcome: "unknown" };

  const found = await payload.find({
    collection: "event-registrations",
    where: token
      ? { token: { equals: token } }
      : { code: { equals: normalizedCode } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  const registration = found.docs[0];
  if (!registration) return { outcome: "unknown" };

  const regEventId = relationId(
    registration.event as number | { id: number }
  ) as number;
  const summary = (doc: EventRegistration): CheckInResult["registration"] => ({
    id: doc.id,
    name: doc.name,
    code: doc.code,
    status: doc.status,
    checkedInAt: doc.checkedInAt,
    eventId: regEventId,
    eventTitle:
      typeof registration.event === "object"
        ? registration.event.title
        : undefined,
  });

  if (eventId && regEventId !== eventId) {
    return { outcome: "wrong_event", registration: summary(registration) };
  }
  if (registration.status === "checked_in") {
    return { outcome: "already", registration: summary(registration) };
  }
  if (registration.status !== "registered" && !force) {
    return {
      outcome:
        registration.status === "waitlisted" ? "waitlisted" : "cancelled",
      registration: summary(registration),
    };
  }

  const updated = await withEventLock(payload, regEventId, async (req) =>
    payload.update({
      collection: "event-registrations",
      id: registration.id,
      data: {
        status: "checked_in",
        checkedInAt: new Date().toISOString(),
        checkedInBy: userId,
        waitlistPosition: null,
      },
      depth: 0,
      overrideAccess: true,
      req,
    })
  );
  revalidateEventSeats(regEventId);
  return { outcome: "ok", registration: summary(updated) };
}

export type WalkInResult =
  | (CheckInResult & { overCapacity: boolean })
  | { outcome: "invalid"; error: string };

/**
 * Registrer noen som dukker opp i døra uten påmelding: opprettes direkte som
 * «møtt». Ingen kapasitetssperre — de står jo der — men svaret sier fra når
 * eventet er fullt, så døra kan bestemme. Ingen e-post sendes.
 */
export async function registerWalkIn({
  eventId,
  name: rawName,
  email: rawEmail,
  userId,
}: {
  eventId: number;
  name: string;
  email?: string | null;
  userId: number;
}): Promise<WalkInResult> {
  const name = rawName.trim().slice(0, 200);
  const email = rawEmail?.trim().toLowerCase() || null;
  if (!name) return { outcome: "invalid", error: "Skriv inn navnet." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { outcome: "invalid", error: "E-postadressen ser ikke riktig ut." };
  }

  const payload = await getEventsPayload();
  const event = await payload
    .findByID({ collection: "events", id: eventId, depth: 0 })
    .catch(() => null);
  if (!event) return { outcome: "invalid", error: "Fant ikke eventet." };

  const { registration, seatsBefore } = await withEventLock(
    payload,
    eventId,
    async (req) => {
      const seatsBefore = await countSeats(payload, eventId, req);
      const registration = await payload.create({
        collection: "event-registrations",
        data: {
          event: eventId,
          source: "walk_in",
          name,
          email,
          status: "checked_in",
          checkedInAt: new Date().toISOString(),
          checkedInBy: userId,
          code: await uniqueCode(payload, req),
          token: generateTicketToken(),
        },
        req,
      });
      return { registration, seatsBefore };
    }
  );
  revalidateEventSeats(eventId);

  return {
    outcome: "ok",
    overCapacity: Boolean(event.capacity && seatsBefore >= event.capacity),
    registration: {
      id: registration.id,
      name: registration.name,
      code: registration.code,
      status: registration.status,
      checkedInAt: registration.checkedInAt,
      eventId,
      eventTitle: event.title,
    },
  };
}

/**
 * Slett en påmelding for godt, f.eks. når noen ber om å bli slettet. Er
 * eventet ikke startet og personen hadde plass, meldes påmeldingen av først,
 * så den første på ventelista rykker opp (kalleren sender billetten).
 */
export async function deleteRegistration(
  registrationId: number
): Promise<{ deleted: boolean; promoted: EventRegistration[] }> {
  const payload = await getEventsPayload();
  const current = await getRegistrationWithToken(registrationId);
  if (!current) return { deleted: false, promoted: [] };

  const upcoming = new Date(current.event.startsAt).getTime() > Date.now();
  const cancelled =
    upcoming && current.status !== "cancelled"
      ? await cancelRegistration({ registrationId, by: "admin" })
      : null;

  // Følget er en del av personens påmelding og slettes sammen med den.
  await payload.delete({
    collection: "event-registrations",
    where: { guestOf: { equals: registrationId } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "event-registrations",
    id: registrationId,
    overrideAccess: true,
  });
  revalidateEventSeats(current.event.id);
  return { deleted: true, promoted: cancelled?.promoted ?? [] };
}

/** Angre en innsjekk (feilskanning). */
export async function undoCheckIn(
  registrationId: number
): Promise<EventRegistration | null> {
  const payload = await getEventsPayload();
  const current = await findRegistrationById(payload, registrationId);
  if (!current || current.status !== "checked_in") return null;
  const updated = await payload.update({
    collection: "event-registrations",
    id: registrationId,
    data: { status: "registered", checkedInAt: null, checkedInBy: null },
    depth: 0,
    overrideAccess: true,
  });
  const eventId = relationId(current.event);
  if (eventId) revalidateEventSeats(eventId);
  return updated;
}

/* ------------------------------------------------------------------ */
/* Oversikt til admin                                                 */
/* ------------------------------------------------------------------ */

export interface RegistrationRow {
  id: number;
  name: string;
  email: string | null;
  status: RegistrationStatus;
  source: RegistrationSource;
  /** Id-en til den som meldte på, når raden er følge. */
  guestOfId: number | null;
  code: string;
  newsletter: boolean;
  answers: RegistrationAnswers;
  waitlistPosition: number | null;
  createdAt: string;
  checkedInAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  promotedAt: string | null;
  payment: {
    provider: string | null;
    amountKr: number | null;
    paidAt: string | null;
    refundedAt: string | null;
  } | null;
}

export interface RegistrationOverview {
  event: {
    id: number;
    title: string;
    startsAt: string;
    capacity: number | null;
    waitlistEnabled: boolean;
    ticketsEnabled: boolean;
    questions: { name: string; label: string }[];
  };
  counts: Record<RegistrationStatus, number>;
  rows: RegistrationRow[];
}

export async function getRegistrationOverview(
  eventId: number
): Promise<RegistrationOverview | null> {
  const payload = await getEventsPayload();
  const event = await payload
    .findByID({ collection: "events", id: eventId, depth: 0, draft: true })
    .catch(() => null);
  if (!event) return null;

  const found = await payload.find({
    collection: "event-registrations",
    where: { event: { equals: eventId } },
    sort: "createdAt",
    limit: 5000,
    depth: 0,
    overrideAccess: true,
  });

  const counts: Record<RegistrationStatus, number> = {
    registered: 0,
    waitlisted: 0,
    checked_in: 0,
    cancelled: 0,
    pending_payment: 0,
    refunded: 0,
  };
  for (const doc of found.docs) counts[doc.status] += 1;

  return {
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      capacity: event.capacity ?? null,
      waitlistEnabled: Boolean(event.waitlistEnabled),
      ticketsEnabled: event.ticketsEnabled !== false,
      questions: (event.extraQuestions ?? [])
        .filter((q): q is ExtraQuestion & { name: string } => Boolean(q.name))
        .map((q) => ({ name: q.name, label: q.label })),
    },
    counts,
    rows: found.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      email: doc.email ?? null,
      status: doc.status,
      source: doc.source ?? "online",
      guestOfId: relationId(doc.guestOf),
      payment: doc.payment?.provider
        ? {
            provider: doc.payment.provider,
            amountKr: doc.payment.amountKr ?? null,
            paidAt: doc.payment.paidAt ?? null,
            refundedAt: doc.payment.refundedAt ?? null,
          }
        : null,
      code: doc.code,
      newsletter: Boolean(doc.newsletter),
      answers: (doc.answers ?? {}) as RegistrationAnswers,
      waitlistPosition: doc.waitlistPosition ?? null,
      createdAt: doc.createdAt,
      checkedInAt: doc.checkedInAt ?? null,
      cancelledAt: doc.cancelledAt ?? null,
      cancelledBy: doc.cancelledBy ?? null,
      promotedAt: doc.promotedAt ?? null,
    })),
  };
}

/** Hent nøkkelen til en påmelding (for å sende billetten på nytt fra admin). */
export async function getRegistrationWithToken(
  registrationId: number
): Promise<(EventRegistration & { event: Event }) | null> {
  const payload = await getEventsPayload();
  const registration = await payload
    .findByID({
      collection: "event-registrations",
      id: registrationId,
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null);
  if (!registration || typeof registration.event !== "object") return null;
  return registration as EventRegistration & { event: Event };
}
