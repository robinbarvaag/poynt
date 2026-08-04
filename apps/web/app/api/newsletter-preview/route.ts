import { buildNewsletterHtml } from "@/lib/newsletter-html";
import config from "@/payload.config";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Render nyhetsbrevet slik det faktisk sendes, til «Forhåndsvisning»-fanen på
 * Nyhetsbrev-dokumentet i admin. Tar imot ulagret innhold rett fra skjemaet,
 * slik at forhåndsvisningen er live mens partneren skriver. Payload-auth.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    const body = (await req.json()) as {
      subject?: string;
      previewText?: string;
      content?: SerializedEditorState;
    };

    if (!body.content) {
      return NextResponse.json(
        { error: "Skriv litt innhold, så dukker forhåndsvisningen opp." },
        { status: 400 }
      );
    }

    const html = await buildNewsletterHtml({
      content: body.content,
      preview: body.previewText || body.subject || "",
    });

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Nyhetsbrev-forhåndsvisning feilet:", error);
    return NextResponse.json(
      { error: "Kunne ikke lage forhåndsvisningen" },
      { status: 500 }
    );
  }
}
