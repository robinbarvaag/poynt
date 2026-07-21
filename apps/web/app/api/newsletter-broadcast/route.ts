import config from "@/payload.config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { sendNewsletterBroadcast, sendNewsletterTest } from "@poynt/email";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Sender et nyhetsbrev fra Nyhetsbrev-collectionen. To moduser:
 * - "test": vanlig e-post til den innloggede admin-brukeren
 * - "send": Resend Broadcast til hele audiencen (RESEND_AUDIENCE_ID) —
 *   markerer deretter dokumentet som sendt (status/sentAt/broadcastId)
 * Brukes av send-panelet på Nyhetsbrev-dokumentet i admin (Payload-auth).
 */

const siteUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

/** E-poster trenger absolutte URL-er — gjør relative src/href absolutte. */
function absolutizeUrls(html: string): string {
  return html.replace(/(src|href)="\/(?!\/)/g, `$1="${siteUrl}/`);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    const body = (await req.json()) as { id?: string | number; mode?: string };
    const { id, mode } = body;
    if (!id || (mode !== "test" && mode !== "send")) {
      return NextResponse.json(
        { error: "Ugyldig forespørsel" },
        { status: 400 }
      );
    }

    const newsletter = await payload.findByID({
      collection: "newsletters",
      id,
      depth: 2,
    });

    if (mode === "send" && newsletter.status === "sent") {
      return NextResponse.json(
        { error: "Dette nyhetsbrevet er allerede sendt." },
        { status: 400 }
      );
    }

    const contentHtml = absolutizeUrls(
      convertLexicalToHTML({
        data: newsletter.content as SerializedEditorState,
      })
    );
    const preview = newsletter.previewText || newsletter.subject;

    if (mode === "test") {
      await sendNewsletterTest({
        to: user.email,
        subject: newsletter.subject,
        preview,
        contentHtml,
      });
      return NextResponse.json({ success: true, sentTo: user.email });
    }

    const { broadcastId } = await sendNewsletterBroadcast({
      subject: newsletter.subject,
      preview,
      contentHtml,
    });

    await payload.update({
      collection: "newsletters",
      id,
      data: {
        status: "sent",
        sentAt: new Date().toISOString(),
        broadcastId,
      },
    });

    return NextResponse.json({ success: true, broadcastId });
  } catch (error) {
    console.error("Nyhetsbrev-utsending feilet:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kunne ikke sende nyhetsbrevet",
      },
      { status: 500 }
    );
  }
}
