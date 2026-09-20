import { ticketPath } from "@/lib/events/codes";
import {
  notifyAdmins,
  sendRegistrationEmail,
  subscribeFromEvent,
} from "@/lib/events/notify";
import { startCheckout } from "@/lib/events/payments";
import {
  registerForEvent,
  releaseUnpaidRegistration,
} from "@/lib/events/registrations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { guardRecaptcha } from "@/lib/recaptcha";
import { type NextRequest, NextResponse, after } from "next/server";

const ERROR_STATUS: Record<string, number> = {
  not_found: 404,
  invalid: 400,
  full: 409,
};

/**
 * Offentlig påmelding til et event. Svaret inneholder billettlenken slik at
 * siden kan vise billetten med en gang — men ALDRI for en e-post som allerede
 * var påmeldt (da kunne hvem som helst hentet ut andres billett og meldt dem
 * av). Da sendes billetten på nytt til e-postadressen i stedet.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request.headers);
  if (
    !rateLimit("event-registration", ip, { limit: 8, windowMs: 10 * 60_000 })
  ) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen om noen minutter." },
      { status: 429 }
    );
  }

  const blocked = await guardRecaptcha(request, "paamelding");
  if (blocked) return blocked;

  const { id } = await params;
  const eventId = Number(id);
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    email?: unknown;
    answers?: unknown;
    newsletter?: unknown;
    guests?: unknown;
    paymentMethod?: unknown;
    website?: unknown;
  } | null;

  if (!body || !Number.isInteger(eventId)) {
    return NextResponse.json(
      { error: "Ugyldig forespørsel." },
      { status: 400 }
    );
  }

  // Honningkrukke: et skjult felt bare roboter fyller ut. Vi later som alt
  // gikk bra, så de ikke prøver seg videre.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ ok: true, status: "registered" });
  }

  try {
    const result = await registerForEvent({
      eventId,
      name: typeof body.name === "string" ? body.name : "",
      email: typeof body.email === "string" ? body.email : "",
      answers:
        body.answers && typeof body.answers === "object"
          ? (body.answers as Record<string, unknown>)
          : {},
      newsletter: body.newsletter === true,
      guests: body.guests,
      paymentMethod: body.paymentMethod,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, reason: result.error },
        { status: ERROR_STATUS[result.error] ?? 409 }
      );
    }

    const { event, registration, alreadyRegistered, guests } = result;

    // Betalt event: send personen til kassen. Billett, kvittering og varsler
    // kommer når betalingen er bekreftet (webhook eller retur til billetten).
    if (registration.status === "pending_payment" && !alreadyRegistered) {
      try {
        const checkoutUrl = await startCheckout({
          event,
          registration,
          provider: registration.payment?.provider ?? "vipps",
        });
        return NextResponse.json({
          ok: true,
          status: "pending_payment",
          checkoutUrl,
        });
      } catch (error) {
        console.error("Kunne ikke starte event-betaling:", error);
        await releaseUnpaidRegistration(registration.id);
        return NextResponse.json(
          { error: "Kunne ikke starte betalingen. Prøv igjen om litt." },
          { status: 502 }
        );
      }
    }

    // Billetten til den påmeldte ventes på (så feil havner i loggen for
    // riktig forespørsel); varsel og nyhetsbrev går etter svaret.
    await sendRegistrationEmail(event, registration);
    if (!alreadyRegistered) {
      after(async () => {
        await Promise.all([
          notifyAdmins(
            registration.status === "waitlisted"
              ? "Ny på venteliste"
              : "Ny påmelding",
            event,
            registration
          ),
          subscribeFromEvent(event, registration),
        ]);
      });
    }

    return NextResponse.json({
      ok: true,
      status: registration.status,
      alreadyRegistered,
      waitlistPosition: registration.waitlistPosition ?? null,
      ...(alreadyRegistered
        ? {}
        : {
            code: event.ticketsEnabled !== false ? registration.code : null,
            ticketUrl: ticketPath(registration.token),
            guestCount: guests.length,
          }),
    });
  } catch (error) {
    console.error("Event-påmelding feilet:", error);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen om litt." },
      { status: 500 }
    );
  }
}
