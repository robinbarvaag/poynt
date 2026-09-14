import { isTicketToken } from "@/lib/events/codes";
import {
  isPaymentProvider,
  paymentMethodsFor,
} from "@/lib/events/payment-rules";
import { PaymentError, startCheckout } from "@/lib/events/payments";
import { findRegistrationByToken } from "@/lib/events/registrations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Betal (eller prøv igjen) fra billettsiden for en plass som venter på
 * betaling — etter avbrutt betaling, eller etter opprykk fra ventelista.
 * Billettlenken er beviset. Svarer med adressen til kassen.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request.headers);
  if (!rateLimit("event-payment", ip, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen om noen minutter." },
      { status: 429 }
    );
  }

  const { token } = await params;
  const registration = isTicketToken(token)
    ? await findRegistrationByToken(token)
    : null;
  if (!registration) {
    return NextResponse.json(
      { error: "Fant ikke billetten." },
      { status: 404 }
    );
  }
  if (registration.guestOf) {
    return NextResponse.json(
      { error: "Betalingen gjøres av den som meldte dere på." },
      { status: 409 }
    );
  }
  if (registration.status !== "pending_payment") {
    return NextResponse.json(
      { error: "Denne billetten venter ikke på betaling." },
      { status: 409 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    provider?: unknown;
  };
  const methods = paymentMethodsFor(registration.event);
  if (!isPaymentProvider(body.provider) || !methods.includes(body.provider)) {
    return NextResponse.json(
      { error: "Velg Vipps eller kort." },
      { status: 400 }
    );
  }

  try {
    const url = await startCheckout({
      event: registration.event,
      registration,
      provider: body.provider,
    });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof PaymentError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Kunne ikke starte event-betaling:", error);
    return NextResponse.json(
      { error: "Kunne ikke starte betalingen. Prøv igjen om litt." },
      { status: 502 }
    );
  }
}
