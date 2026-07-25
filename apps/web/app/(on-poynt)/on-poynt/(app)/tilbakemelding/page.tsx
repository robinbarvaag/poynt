import { requireFeature } from "@/lib/features/server";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { FeedbackClient } from "./feedback-client";

export default async function FeedbackPage() {
  await requireFeature("tilbakemelding");
  const trpc = await createServerCaller();
  const mine = await trpc.feedback.listMine().catch(() => []);

  return <FeedbackClient initial={mine} />;
}
