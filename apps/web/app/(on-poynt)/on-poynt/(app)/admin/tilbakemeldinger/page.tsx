import { createServerCaller } from "@/lib/planner/trpc-server";
import { redirect } from "next/navigation";
import { AdminFeedbackClient } from "./admin-feedback-client";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const trpc = await createServerCaller();

  let items: Awaited<ReturnType<typeof trpc.feedback.listAll>>;
  try {
    // adminProcedure kaster FORBIDDEN for ikke-admin.
    items = await trpc.feedback.listAll();
  } catch {
    redirect("/on-poynt/oversikt");
  }

  return <AdminFeedbackClient initial={items} />;
}
