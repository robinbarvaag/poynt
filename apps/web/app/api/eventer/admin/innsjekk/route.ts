import { getAdminUser } from "@/lib/events/admin-auth";
import { extractTicketToken } from "@/lib/events/codes";
import {
  type CheckInResult,
  type WalkInResult,
  checkInRegistration,
  getEventsPayload,
  registerWalkIn,
} from "@/lib/events/registrations";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Innsjekk i døra: tar imot det skanneren leste (billettlenken fra QR-koden),
 * en kode tastet inn for hånd, eller en person som registreres på stedet
 * (`walkIn`), og svarer med utfall + tellere.
 */
export async function POST(request: NextRequest) {
  const user = await getAdminUser(request.headers);
  if (!user) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    eventId?: number;
    scanned?: string;
    code?: string;
    force?: boolean;
    walkIn?: { name?: string; email?: string };
  };
  const eventId = Number(body.eventId) || null;

  let result: CheckInResult | WalkInResult;
  if (body.walkIn) {
    if (!eventId) {
      return NextResponse.json({ error: "Velg event." }, { status: 400 });
    }
    result = await registerWalkIn({
      eventId,
      name: String(body.walkIn.name ?? ""),
      email: body.walkIn.email ? String(body.walkIn.email) : null,
      userId: user.id as number,
    });
    if (result.outcome === "invalid") {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } else {
    const token = body.scanned ? extractTicketToken(body.scanned) : null;
    result =
      token || body.code
        ? await checkInRegistration({
            token,
            code: token ? null : body.code,
            eventId,
            userId: user.id as number,
            force: body.force === true,
          })
        : { outcome: "unknown" as const };
  }

  let counts: {
    checkedIn: number;
    seats: number;
    capacity: number | null;
  } | null = null;
  if (eventId) {
    const payload = await getEventsPayload();
    const [checkedIn, seats, event] = await Promise.all([
      payload.count({
        collection: "event-registrations",
        where: {
          event: { equals: eventId },
          status: { equals: "checked_in" },
        },
      }),
      payload.count({
        collection: "event-registrations",
        where: {
          event: { equals: eventId },
          status: { in: ["registered", "checked_in"] },
        },
      }),
      payload
        .findByID({ collection: "events", id: eventId, depth: 0 })
        .catch(() => null),
    ]);
    counts = {
      checkedIn: checkedIn.totalDocs,
      seats: seats.totalDocs,
      capacity: event?.capacity ?? null,
    };
  }

  return NextResponse.json({ ...result, counts });
}
