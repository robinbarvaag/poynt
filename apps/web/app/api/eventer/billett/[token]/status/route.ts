import { isTicketToken } from "@/lib/events/codes";
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
  const registration = isTicketToken(token)
    ? await findRegistrationByToken(token)
    : null;
  if (!registration) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }
  return NextResponse.json(
    { status: registration.status },
    { headers: { "Cache-Control": "no-store" } }
  );
}
