import { fetchOgMeta } from "@/lib/og";
import config from "@/payload.config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Henter Open Graph-metadata (tittel, beskrivelse, bilde) for en lenke. Brukes
 * av «Hent forhåndsvisning»-komponenten på bokmerke-blokken i admin, slik at
 * partneren ser resultatet live ved innliming – ikke først ved lagring.
 *
 * Kun for innloggede admin-brukere (selve hentingen gjør et server-side fetch
 * mot en vilkårlig URL). Samme henter som lagrings-hooken (lib/og.ts).
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get("url")?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "Oppgi en gyldig http(s)-URL." },
        { status: 400 }
      );
    }

    const og = await fetchOgMeta(url);
    return NextResponse.json(og);
  } catch (error) {
    console.error("OG fetch error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente info fra lenken akkurat nå." },
      { status: 500 }
    );
  }
}
