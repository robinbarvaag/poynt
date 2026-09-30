import { lexicalToEmailHtml } from "@/lib/newsletter-html";
import config from "@/payload.config";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  getNewsletterAudienceStats,
  sendNewsletterBroadcast,
  sendNewsletterTest,
  sendNewsletterTestBroadcast,
} from "@poynt/email";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Sender et nyhetsbrev fra Nyhetsbrev-collectionen. Tre moduser:
 * - "test": vanlig e-post til den innloggede admin-brukeren
 * - "test-broadcast": ekte Resend Broadcast, men bare til admin-brukeren (via
 *   test-segmentet) — avmeldingslenke og flettefelt virker som i den ekte
 * - "send": Resend Broadcast til hele lista — markerer deretter dokumentet
 *   som sendt (status/sentAt/broadcastId)
 * Brukes av send-panelet på Nyhetsbrev-dokumentet i admin (Payload-auth).
 */

const MODES = ["test", "test-broadcast", "send"] as const;
type Mode = (typeof MODES)[number];

/**
 * Antall aktive abonnenter — vises i bekreftelsen før «Send til alle», så
 * partneren ser hvor mange som faktisk får e-posten.
 */
export async function GET(req: NextRequest) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  try {
    const stats = await getNewsletterAudienceStats();
    return NextResponse.json({ subscribers: stats.subscribed });
  } catch (error) {
    console.error("Kunne ikke telle abonnenter:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente antall abonnenter" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });
    if (!user) {
      return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
    }

    const body = (await req.json()) as { id?: string | number; mode?: string };
    const { id } = body;
    const mode = body.mode as Mode | undefined;
    if (!id || !mode || !MODES.includes(mode)) {
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

    const contentHtml = lexicalToEmailHtml(
      newsletter.content as SerializedEditorState
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

    if (mode === "test-broadcast") {
      const { broadcastId } = await sendNewsletterTestBroadcast({
        to: user.email,
        subject: newsletter.subject,
        preview,
        contentHtml,
      });
      return NextResponse.json({
        success: true,
        sentTo: user.email,
        broadcastId,
      });
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
