import { eventIcs } from "@/lib/events/notify";
import { getEventsPayload } from "@/lib/events/registrations";
import { generateSlug } from "@/lib/generate-slug";
import { type NextRequest, NextResponse } from "next/server";

/** «Legg til i kalender»: .ics-fil for et publisert event. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) {
    return NextResponse.json({ error: "Ugyldig event." }, { status: 400 });
  }

  const payload = await getEventsPayload();
  const event = await payload
    .findByID({ collection: "events", id: eventId, depth: 0 })
    .catch(() => null);
  if (!event || event._status !== "published") {
    return NextResponse.json({ error: "Fant ikke eventet." }, { status: 404 });
  }

  return new NextResponse(eventIcs(event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${generateSlug(event.title) || "event"}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
