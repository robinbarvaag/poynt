import config from "@/payload.config";
import { draftMode } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Slår på Next draft mode og sender redaktøren videre til siden. Preview- og
 * live preview-knappene i admin peker hit. Ingen delt hemmelighet — vi krever
 * i stedet en innlogget Payload-bruker (samme cookie som admin), så lenken er
 * ubrukelig for alle andre.
 */
export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path") || "/";

  // Kun interne stier — ellers kan lenken brukes som åpen redirect.
  if (!path.startsWith("/") || path.startsWith("//")) {
    return NextResponse.json({ error: "Ugyldig sti" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json(
      { error: "Forhåndsvisning krever innlogget admin-bruker" },
      { status: 401 }
    );
  }

  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, req.nextUrl.origin));
}
