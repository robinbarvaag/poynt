"use server";

import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamChannelGuide } from "@poynt/planner-api/lib/channel-guide";
import {
  type ChannelGuideRequest,
  type ChannelGuideStream,
  channelGuideRequestSchema,
} from "@poynt/planner-validators";
import type { DeepPartial } from "ai";
import { headers } from "next/headers";

/**
 * Server action: streamer en kanalanbefaling som en RSC streamable value.
 * Klienten leser delobjektene med `readStreamableValue` og rendrer dem
 * progressivt. Ingen API-rute, ingen deprecated AI-API.
 */
export async function channelGuideStreamAction(input: ChannelGuideRequest) {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);
  if (!session || !hasActiveAccess(session.membership)) {
    throw new Error("Ikke innlogget");
  }

  const parsed = channelGuideRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Manglende eller ugyldige felt");
  }

  const { partialOutputStream } = await streamChannelGuide({
    userId: session.user.id,
    input: parsed.data,
  });

  const stream = createStreamableValue<DeepPartial<ChannelGuideStream>>();
  (async () => {
    try {
      for await (const partial of partialOutputStream) {
        stream.update(partial);
      }
      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return stream.value;
}
