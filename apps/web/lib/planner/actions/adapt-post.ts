"use server";

import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamAdaptedPosts } from "@poynt/planner-api/lib/adapt-post";
import {
  type AdaptPostRequest,
  type AdaptedPostsStream,
  adaptPostRequestSchema,
} from "@poynt/planner-validators";
import type { DeepPartial } from "ai";
import { headers } from "next/headers";

/**
 * Server action: tar ett ferdig innlegg → streamer tilpassede varianter per
 * kanal som en RSC streamable value.
 */
export async function adaptPostStreamAction(input: AdaptPostRequest) {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);
  if (!session || !hasActiveAccess(session.membership)) {
    throw new Error("Ikke innlogget");
  }

  const parsed = adaptPostRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Manglende eller ugyldige felt");
  }

  const { partialOutputStream } = await streamAdaptedPosts({
    userId: session.user.id,
    input: parsed.data,
  });

  const stream = createStreamableValue<DeepPartial<AdaptedPostsStream>>();
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
