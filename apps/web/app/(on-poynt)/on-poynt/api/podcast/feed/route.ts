import { getSessionWithMembership } from "@/lib/membership";
import {
  hasActiveAccess,
  hasAiTools,
} from "@/lib/membership/has-active-access";
import {
  PodcastUrlError,
  parsePodcastFeed,
} from "@/lib/podcast/transcribe-url";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);

  if (!session || !hasActiveAccess(session.membership)) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  if (!hasAiTools(session.membership.tier)) {
    return NextResponse.json(
      { error: "Krever Community AI-abonnement" },
      { status: 403 }
    );
  }

  let url: string | undefined;
  try {
    const body = (await request.json()) as { url?: string };
    url = body.url?.trim();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "Lim inn en gyldig lenke (http/https)." },
      { status: 400 }
    );
  }

  try {
    const episodes = await parsePodcastFeed(url);
    return NextResponse.json({ episodes });
  } catch (error) {
    if (error instanceof PodcastUrlError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Podcast feed parse failed:", error);
    return NextResponse.json(
      { error: "Kunne ikke lese feeden. Prøv igjen." },
      { status: 500 }
    );
  }
}
