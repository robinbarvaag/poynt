import { getAdminUser } from "@/lib/events/admin-auth";
import { getRegistrationOverview } from "@/lib/events/registrations";
import { type NextRequest, NextResponse } from "next/server";

/** Påmeldte-fanen: alle påmeldinger til ett event, med tellere. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminUser(request.headers))) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const { id } = await params;
  const overview = await getRegistrationOverview(Number(id));
  if (!overview) {
    return NextResponse.json({ error: "Fant ikke eventet." }, { status: 404 });
  }
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store" },
  });
}
