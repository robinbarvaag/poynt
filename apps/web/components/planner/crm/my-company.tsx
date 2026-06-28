"use client";

import { BrandBookSection } from "@/components/workspace/brand-book-section";
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
import { useState } from "react";

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
  // Nettside funnet via Brønnøysund-oppslag i Profil — mates videre til
  // merkevare-crawlen (Stemmen) så ett org.nr drar i gang hele profilen.
  const [discoveredWebsite, setDiscoveredWebsite] = useState<string>();

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
                onWebsiteFound={setDiscoveredWebsite}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merkevare" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Merkevare-boka — den visuelle identiteten</CardTitle>
              <CardDescription>
                Logo, farger, fonter og tagline. Dette er ansiktet til
                merkevaren — og verktøyene tar hensyn til det når de lager
                innhold for deg.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandBookSection
                workspaceId={workspace.id}
                businessName={workspace.name}
                disabled={!canManage}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merkevarebrief — tonen og budskapet</CardTitle>
              <CardDescription>
                Tone, kjernebudskap og det som skiller dere ut. Vi kan lese
                nettsiden og foreslå en brief du ser over og justerer — den
                styrer hvordan verktøyene skriver for deg.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BrandBriefSection
                workspaceId={workspace.id}
                businessName={workspace.name}
                disabled={!canManage}
                defaultUrl={discoveredWebsite}
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
                  Gi en kollega (f.eks. en SoMe-ansvarlig) tilgang til å jobbe i
                  verktøyene sammen med deg, eller inviter en kunde for innsyn.
                  Rollen du velger styrer hva de får lov til.
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
