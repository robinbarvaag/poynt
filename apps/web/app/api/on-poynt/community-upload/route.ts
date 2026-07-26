import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Vedlegg-opplasting for medlemsfellesskapet. Tillater bilder og vanlige
 * dokument-/mediatyper (i motsetning til merkevare-opplastinga som kun tar
 * bilder/fonter). Lagrer til Vercel Blob under `on-poynt/community/<bruker>/`.
 */
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
]);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  const session = await getSessionWithMembership(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasActiveAccess(session.membership)) {
    return NextResponse.json(
      { error: "Krever aktivt medlemskap" },
      { status: 403 }
    );
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

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Filtypen støttes ikke." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Filen er for stor (maks 15 MB)." },
      { status: 413 }
    );
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(
      `on-poynt/community/${session.user.id}/${crypto.randomUUID()}-${safeName}`,
      file,
      { access: "public", addRandomSuffix: false }
    );
    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error("Community upload failed:", error);
    return NextResponse.json(
      { error: "Opplasting feilet. Prøv igjen." },
      { status: 500 }
    );
  }
}
