import config from "@/payload.config";
import { gateway, generateText } from "ai";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Genererer alt-tekst for et bilde med en vision-modell. Brukes av «Generer
 * alt-tekst»-knappen i Media-admin, men er et generelt endepunkt: send enten
 * `{ mediaId }` (eksisterende Media-dokument), `{ imageUrl }`, eller en
 * `multipart/form-data` med et `file`-felt for å sende inn et bilde direkte.
 *
 * Selve kallet går via Vercel AI Gateway (samme oppsett som de andre
 * AI-verktøyene, se packages/planner-api/lib/models.ts). Modellen må kunne
 * lese bilder — claude-sonnet-4-6 gjør det.
 */

const ALT_SYSTEM = `Du skriver alt-tekst for bilder på et norsk nettsted.
Returner KUN selve alt-teksten – ingen anførselstegn, ingen forklaring, ingen «Alt-tekst:».
Skriv på norsk bokmål, i én konsis og konkret setning (sikt mot maks ~125 tegn).
Ikke begynn med «Bilde av», «Et bilde som viser» e.l. – beskriv motivet direkte.
Beskriv det viktigste motivet, eventuell handling og stemning. Tar bildet med tydelig tekst (f.eks. en plakat), ta med den viktige teksten.`;

const altModel = gateway("anthropic/claude-sonnet-4-6");

/** Henter bildebytes fra en URL (absolutt eller Payload-relativ). */
async function fetchImageBytes(
  url: string,
  req: NextRequest
): Promise<{ bytes: Uint8Array; mediaType: string }> {
  const absolute = new URL(url, req.nextUrl.origin).toString();
  // Videresend cookie slik at også private/innloggings-beskyttede media hentes.
  const cookie = req.headers.get("cookie");
  const res = await fetch(absolute, {
    headers: cookie ? { cookie } : undefined,
  });
  if (!res.ok) {
    throw new Error(`Kunne ikke hente bildet (${res.status}).`);
  }
  const mediaType = res.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  return { bytes, mediaType };
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
    }

    let bytes: Uint8Array;
    let mediaType: string;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData().catch(() => null);
      const file = form?.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "Ingen fil mottatt" },
          { status: 400 }
        );
      }
      mediaType = file.type || "image/jpeg";
      bytes = new Uint8Array(await file.arrayBuffer());
    } else {
      const body = (await req.json().catch(() => ({}))) as {
        mediaId?: string | number;
        imageUrl?: string;
      };

      if (body.mediaId !== undefined && body.mediaId !== null) {
        const media = await payload.findByID({
          collection: "media",
          id: body.mediaId,
        });
        if (!media?.url) {
          return NextResponse.json(
            { error: "Fant ikke bildet." },
            { status: 404 }
          );
        }
        if (media.mimeType && !media.mimeType.startsWith("image/")) {
          return NextResponse.json(
            { error: "Alt-tekst kan kun genereres for bilder." },
            { status: 400 }
          );
        }
        ({ bytes, mediaType } = await fetchImageBytes(media.url, req));
        // Bruk lagret mimeType hvis den finnes (mer presis enn responsens).
        if (media.mimeType) mediaType = media.mimeType;
      } else if (body.imageUrl) {
        ({ bytes, mediaType } = await fetchImageBytes(body.imageUrl, req));
      } else {
        return NextResponse.json(
          { error: "Mangler bilde – send mediaId, imageUrl eller en fil." },
          { status: 400 }
        );
      }
    }

    if (!mediaType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Alt-tekst kan kun genereres for bilder." },
        { status: 400 }
      );
    }

    const { text } = await generateText({
      model: altModel,
      system: ALT_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Skriv alt-tekst for dette bildet.",
            },
            { type: "image", image: bytes, mediaType },
          ],
        },
      ],
    });

    const alt = text
      .trim()
      .replace(/^["«»]+|["«»]+$/g, "")
      .trim();
    if (!alt) {
      return NextResponse.json(
        { error: "Modellen returnerte tom alt-tekst. Prøv igjen." },
        { status: 502 }
      );
    }

    return NextResponse.json({ alt });
  } catch (error) {
    console.error("Alt-text generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunne ikke generere alt-tekst akkurat nå.",
      },
      { status: 500 }
    );
  }
}
