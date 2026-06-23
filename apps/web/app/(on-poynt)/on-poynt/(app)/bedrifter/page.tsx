import { MyCompany } from "@/components/planner/crm/my-company";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { Card, CardDescription, CardHeader, CardTitle } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";

export const metadata = {
  title: "Min bedrift",
};

export default async function MyCompanyPage() {
  const trpc = await createServerCaller();
  const current = await trpc.workspace.getCurrentWorkspace().catch(() => null);
  const workspace = current
    ? await trpc.workspace.getById({ id: current.id }).catch(() => null)
    : null;

  if (!workspace) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="building-2" />
              Ingen bedrift valgt
            </CardTitle>
            <CardDescription>
              Opprett eller velg en bedrift i bedriftsvelgeren øverst i
              sidemenyen for å komme i gang.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <MyCompany workspace={workspace} />;
}
