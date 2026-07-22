import { createServerCaller } from "@/lib/planner/trpc-server";
import { FeedbackClient } from "./feedback-client";

export default async function FeedbackPage() {
  const trpc = await createServerCaller();
  const mine = await trpc.feedback.listMine().catch(() => []);

  return <FeedbackClient initial={mine} />;
}
