import { TierGate } from "@/components/planner/tier-gate";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type { InquiryReplyStream } from "@poynt/planner-validators";
import { InquiryReplyClient } from "./inquiry-reply-client";

export default async function InquiryReplyPage() {
  const trpc = await createServerCaller();

  let initialSaved: InquiryReplyStream | null = null;
  try {
    const saved = await trpc.toolResult.list({
      toolId: "inquiry-reply",
      limit: 1,
    });
    const first = saved[0];
    if (first?.result) {
      const r = first.result as Partial<InquiryReplyStream>;
      if (r.variants && r.variants.length > 0) {
        initialSaved = {
          detectedSentiment: r.detectedSentiment ?? "neutral",
          summary: r.summary ?? "",
          variants: r.variants,
          tips: r.tips ?? [],
        };
      }
    }
  } catch (error) {
    console.error("Could not fetch saved result:", error);
  }

  return (
    <TierGate>
      <InquiryReplyClient initialSaved={initialSaved} />
    </TierGate>
  );
}
