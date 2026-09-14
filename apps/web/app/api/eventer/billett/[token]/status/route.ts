import { isTicketToken } from "@/lib/events/codes";
import { syncAndNotify } from "@/lib/events/payment-jobs";
import { findRegistrationByToken } from "@/lib/events/registrations";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Status for billettsiden, så den kan rive av billetten i det personen blir
 * skannet i døra. Nøkkelen i URL-en er beviset; svaret inneholder bare
 * statusen.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  let registration = isTicketToken(token)
    ? await findRegistrationByToken(token)
    : null;
  if (!registration) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  // Venter på betaling: spør Vipps/Stripe direkte, så billetten dukker opp
  // selv om webhooken er treg (eller ikke når fram lokalt).
  if (
    registration.status === "pending_payment" &&
    registration.payment?.reference
  ) {
    try {
      const sync = await syncAndNotify(registration);
      if (sync.state !== "pending" && sync.state !== "none") {
        registration = (await findRegistrationByToken(token)) ?? registration;
      }
    } catch (error) {
      console.error("Betalingssjekk fra billettsiden feilet:", error);
    }
  }

  return NextResponse.json(
    { status: registration.status },
    { headers: { "Cache-Control": "no-store" } }
  );
}
