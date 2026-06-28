import { auth } from "@poynt/planner-auth/server";
import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

// Tillatte typer + maks størrelse for merkevare-opplasting (logo/moodboard/font).
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  // Egne merkevare-fonter
  "font/woff",
  "font/woff2",
  "font/ttf",
  "font/otf",
  // Noen nettlesere sender disse for fonter
  "application/font-woff",
  "application/x-font-woff",
  "application/font-sfnt",
  "application/octet-stream",
]);
// Fallback når nettleseren ikke setter en font-MIME (vanlig for .woff2/.otf).
const ALLOWED_FONT_EXT = /\.(woff2?|ttf|otf)$/i;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Opplasting av merkevare-bilder (logo, moodboard) for innloggede On Poynt-medlemmer.
 * Lagrer til Vercel Blob (samme lager som Payload-media) og returnerer en
 * offentlig URL som lagres i brandIdentity på workspace-profilen.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      {
        error: "Opplasting er ikke konfigurert (mangler BLOB_READ_WRITE_TOKEN)",
      },
      { status: 500 }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Ingen fil mottatt" }, { status: 400 });
  }

  const typeOk =
    ALLOWED_TYPES.has(file.type) || ALLOWED_FONT_EXT.test(file.name);
  if (!typeOk) {
    return NextResponse.json(
      {
        error:
          "Filtypen støttes ikke. Bruk PNG, JPG, WEBP, SVG, GIF eller WOFF/WOFF2/TTF/OTF.",
      },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Filen er for stor (maks 5 MB)." },
      { status: 413 }
    );
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(
      `on-poynt/brand/${session.user.id}/${crypto.randomUUID()}-${safeName}`,
      file,
      { access: "public", addRandomSuffix: false }
    );
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Brand upload failed:", error);
    return NextResponse.json(
      { error: "Opplasting feilet. Prøv igjen." },
      { status: 500 }
    );
  }
}
