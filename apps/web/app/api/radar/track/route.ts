import { recordView } from "@/lib/radar/views";
import { TRACKED_COLLECTIONS } from "@/lib/radar/views";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      collection?: string;
      contentId?: string;
      slug?: string;
    };

    if (
      !body.collection ||
      !body.contentId ||
      !TRACKED_COLLECTIONS.includes(
        body.collection as (typeof TRACKED_COLLECTIONS)[number]
      )
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await recordView({
      collection: body.collection,
      contentId: body.contentId,
      slug: body.slug,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Stille feil — en mislykket teller skal aldri påvirke brukeropplevelsen.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
