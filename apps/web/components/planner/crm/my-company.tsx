"use client";

import { BrandBriefSection } from "@/components/workspace/brand-brief-section";
import { WorkspaceGeneralForm } from "@/components/workspace/general-form";
import { WorkspaceInviteForm } from "@/components/workspace/invite-form";
import { WorkspaceMemberList } from "@/components/workspace/member-list";
import { WorkspaceProfileForm } from "@/components/workspace/profile-form";
import { workspaceRoleLabels } from "@poynt/planner-validators";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  PageShell,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: "owner" | "admin" | "member" | "client";
};

/**
 * «Min bedrift» — administrerer den AKTIVE bedriften. Bytte/liste/opprett
 * skjer i bedriftsvelgeren i sidebaren, så her trengs verken grid eller sheet.
 */
export function MyCompany({ workspace }: { workspace: Workspace }) {
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return (
    <PageShell>
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Icon name="building-2" className="size-5" />
        </div>
        <div className="min-w-0">
          <Heading size="h2">{workspace.name}</Heading>
          <p className="text-sm text-muted-foreground">
            {workspaceRoleLabels[workspace.role]}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil" className="gap-2">
            <Icon name="target" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="merkevare" className="gap-2">
            <Icon name="palette" />
            Merkevare
          </TabsTrigger>
          <TabsTrigger value="innstillinger" className="gap-2">
            <Icon name="settings" />
            Innstillinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil — hva verktøyene vet</CardTitle>
              <CardDescription>
                Faktaene om bedriften: bransje, målgruppe, mål og ressurser.
                Dette er rammene AI-verktøyene jobber innenfor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceProfileForm
                workspaceId={workspace.id}
                disabled={!canManage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merkevare" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Merkevare — hvordan verktøyene skriver</CardTitle>
              <CardDescription>
                Stemmen og budskapet: tone, kjernebudskap og det som skiller
                dere ut. Mens profilen er hva verktøyene vet, er dette hvordan
                de uttrykker det. Generert fra nettsiden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandBriefSection
                workspaceId={workspace.id}
                businessName={workspace.name}
                disabled={!canManage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medlemmer + generelle innstillinger samlet — slått sammen så vi
            slipper en nær-tom «Innstillinger»-fane. */}
        <TabsContent value="innstillinger" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medlemmer</CardTitle>
              <CardDescription>
                Hvem som har tilgang til denne bedriften.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceMemberList
                workspaceId={workspace.id}
                canManage={canManage}
                currentUserRole={workspace.role}
              />
            </CardContent>
          </Card>

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Inviter medlemmer</CardTitle>
                <CardDescription>
                  Send invitasjon til nye medlemmer eller kunder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceInviteForm workspaceId={workspace.id} />
              </CardContent>
            </Card>
          )}

          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle>Generelle innstillinger</CardTitle>
                <CardDescription>Oppdater bedriftens navn.</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceGeneralForm workspace={workspace} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
