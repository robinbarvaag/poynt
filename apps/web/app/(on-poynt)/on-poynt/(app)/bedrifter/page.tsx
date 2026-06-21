import { CompaniesView } from "@/components/planner/crm/companies-view";
import { createServerCaller } from "@/lib/planner/trpc-server";

export const metadata = {
  title: "Bedrifter",
};

export default async function BedrifterPage() {
  const trpc = await createServerCaller();
  const [companies, current] = await Promise.all([
    trpc.workspace.list(),
    trpc.workspace.getCurrentWorkspace(),
  ]);

  return (
    <CompaniesView
      companies={companies}
      activeWorkspaceId={current?.id ?? null}
    />
  );
}
