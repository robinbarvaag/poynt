import { getAdminUser } from "@/lib/events/admin-auth";
import { extractTicketToken } from "@/lib/events/codes";
import {
  checkInRegistration,
  getEventsPayload,
} from "@/lib/events/registrations";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Innsjekk i døra: tar imot det skanneren leste (billettlenken fra QR-koden)
 * eller en kode tastet inn for hånd, og svarer med utfall + tellere.
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
  };
  const eventId = Number(body.eventId) || null;

  const token = body.scanned ? extractTicketToken(body.scanned) : null;
  const result =
    token || body.code
      ? await checkInRegistration({
          token,
          code: token ? null : body.code,
          eventId,
          userId: user.id as number,
          force: body.force === true,
        })
      : { outcome: "unknown" as const };

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
