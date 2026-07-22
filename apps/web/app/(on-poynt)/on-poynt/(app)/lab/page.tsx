import { getPlaygroundSession } from "@/lib/planner/playground-access";
import { PLAYGROUND_MODELS } from "@poynt/planner-api/lib/models";
import { getPlaygroundTools } from "@poynt/planner-api/lib/playground";
import { redirect } from "next/navigation";
import { PlaygroundClient } from "./playground-client";

export default async function LabPage() {
  const session = await getPlaygroundSession();
  if (!session) redirect("/on-poynt/oversikt");

  const tools = await getPlaygroundTools();

  return <PlaygroundClient tools={tools} models={[...PLAYGROUND_MODELS]} />;
}
