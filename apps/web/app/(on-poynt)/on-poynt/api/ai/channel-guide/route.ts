import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { streamChannelGuide } from "@poynt/planner-api/lib/channel-guide-stream";
import { channelGuideRequestSchema } from "@poynt/planner-validators";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Auth — samme mønster som podkast-transkripsjonsruta.
  const headersList = await headers();
  const authReq = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(authReq);

  if (!session || !hasActiveAccess(session.membership)) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  // Valider input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  const parsed = channelGuideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Manglende eller ugyldige felt" },
      { status: 400 }
    );
  }

  const result = await streamChannelGuide({
    userId: session.user.id,
    input: parsed.data,
  });

  return result.toTextStreamResponse();
}
