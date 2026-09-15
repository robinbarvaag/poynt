import {
  buildWeeklyIcs,
  icsFileName,
  parseWeeklyEventParams,
} from "@/lib/vekst/ics";
import type { NextRequest } from "next/server";

/**
 * Kalenderfil for en fast ukentlig avtale (brukes av «Omsetnings-onsdag»-
 * blokken). Alt ligger i lenken, så ruta trenger ingen database:
 * /api/kalender?title=…&day=WE&start=09:00&duration=240
 */
export async function GET(request: NextRequest) {
  const event = parseWeeklyEventParams(request.nextUrl.searchParams);
  if (!event) {
    return new Response("Ugyldig kalenderlenke.", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(buildWeeklyIcs(event), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${icsFileName(event)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
