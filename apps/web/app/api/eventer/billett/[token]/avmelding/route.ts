import { isTicketToken } from "@/lib/events/codes";
import {
  notifyAdmins,
  sendCancellationEmail,
  sendRegistrationEmail,
} from "@/lib/events/notify";
import {
  cancelRegistration,
  findRegistrationByToken,
} from "@/lib/events/registrations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { type NextRequest, NextResponse, after } from "next/server";

/**
 * Selvbetjent avmelding fra billettsiden. Billettlenken er beviset — bare den
 * som har fått e-posten har nøkkelen — så det trengs ingen ekstra bekreftelse
 * på e-post. Den som står først på ventelista rykker opp automatisk.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request.headers);
  if (!rateLimit("event-cancel", ip, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen om noen minutter." },
      { status: 429 }
    );
  }

  const { token } = await params;
  if (!isTicketToken(token)) {
    return NextResponse.json({ error: "Ugyldig billett." }, { status: 404 });
  }

  const registration = await findRegistrationByToken(token);
  if (!registration) {
    return NextResponse.json(
      { error: "Fant ikke billetten." },
      { status: 404 }
    );
  }
  if (registration.status === "checked_in") {
    return NextResponse.json(
      { error: "Du er allerede sjekket inn, så billetten kan ikke meldes av." },
      { status: 409 }
    );
  }

  try {
    const result = await cancelRegistration({
      registrationId: registration.id,
      by: "self",
    });
    if (!result) {
      return NextResponse.json(
        { error: "Fant ikke billetten." },
        { status: 404 }
      );
    }

    const event = registration.event;
    if (!result.alreadyCancelled) {
      after(async () => {
        await Promise.all([
          sendCancellationEmail(event, result.registration, false),
          notifyAdmins("Avmelding", event, result.registration),
          result.promoted
            ? sendRegistrationEmail(event, result.promoted, { promoted: true })
            : Promise.resolve(),
        ]);
      });
    }

    return NextResponse.json({ ok: true, status: "cancelled" });
  } catch (error) {
    console.error("Avmelding feilet:", error);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen om litt." },
      { status: 500 }
    );
  }
}
