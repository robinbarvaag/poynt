import { Icon } from "@poynt/ui/icons";
import { Card, CardDescription, CardHeader, CardTitle, Heading } from "@poynt/ui";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { WorkspaceSettingsTabs } from "@/components/workspace/settings-tabs";
import { redirect } from "next/navigation";

export default async function WorkspaceSettingsPage() {
  const trpc = await createServerCaller();
  const currentWorkspace = await trpc.workspace.getCurrentWorkspace();
  
  if (!currentWorkspace) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="building-2" />
              Ingen bedrift valgt
            </CardTitle>
            <CardDescription>
              Du må velge eller opprette en bedrift før du kan se innstillinger.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const workspace = await trpc.workspace.getById({ id: currentWorkspace.id });
  
  if (!workspace) {
    redirect("/on-poynt");
  }

  const userRole = workspace.role;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Heading>
          <Icon name="building-2" />
          {workspace.name}
        </Heading>
        <p className="text-muted-foreground mt-1">
          Administrer innstillinger og medlemmer for denne bedriften.
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {userRole === "owner" && (
            <>
              <Icon name="crown" />
              <span>Du er eier</span>
            </>
          )}
          {userRole === "admin" && (
            <>
              <Icon name="shield" />
              <span>Du er administrator</span>
            </>
          )}
          {userRole === "member" && (
            <>
              <Icon name="user" />
              <span>Du er medlem</span>
            </>
          )}
          {userRole === "client" && (
            <>
              <Icon name="eye" />
              <span>Du er kunde (begrenset tilgang)</span>
            </>
          )}
        </div>
      </div>

      <WorkspaceSettingsTabs workspace={workspace} userRole={userRole} />
    </div>
  );
}
