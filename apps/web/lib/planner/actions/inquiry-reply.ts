"use server";

import { getSessionWithMembership } from "@/lib/membership";
import { hasActiveAccess } from "@/lib/membership/has-active-access";
import { createStreamableValue } from "@ai-sdk/rsc";
import { streamInquiryReply } from "@poynt/planner-api/lib/inquiry-reply";
import {
  type InquiryReplyRequest,
  type InquiryReplyStream,
  inquiryReplyRequestSchema,
} from "@poynt/planner-validators";
import type { DeepPartial } from "ai";
import { headers } from "next/headers";

/**
 * Server action: streamer 2-3 svarvarianter som en RSC streamable value.
 * Klienten leser delobjektene med `useToolStream` og rendrer dem progressivt.
 */
export async function inquiryReplyStreamAction(input: InquiryReplyRequest) {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);
  if (!session || !hasActiveAccess(session.membership)) {
    throw new Error("Ikke innlogget");
  }

  const parsed = inquiryReplyRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Manglende eller ugyldige felt");
  }

  const { partialOutputStream } = await streamInquiryReply({
    userId: session.user.id,
    input: parsed.data,
  });

  const stream = createStreamableValue<DeepPartial<InquiryReplyStream>>();
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
