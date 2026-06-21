"use client";

import { WorkspaceGeneralForm } from "@/components/workspace/general-form";
import { WorkspaceInviteForm } from "@/components/workspace/invite-form";
import { WorkspaceMemberList } from "@/components/workspace/member-list";
import { trpc } from "@/lib/planner/trpc";
import { workspaceRoleLabels } from "@poynt/planner-validators";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ListDetailDetailContent,
  ListDetailDetailHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type Company = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: "owner" | "admin" | "member" | "client";
};

export function CompanyDetail({
  company,
  isActive,
}: {
  company: Company;
  isActive: boolean;
}) {
  const router = useRouter();
  const [activating, setActivating] = React.useState(false);
  const canManage = company.role === "owner" || company.role === "admin";

  async function handleActivate() {
    setActivating(true);
    try {
      await trpc.workspace.switchWorkspace.mutate({ workspaceId: company.id });
      toast.success(`Byttet til ${company.name}`);
      router.refresh();
    } catch {
      toast.error("Kunne ikke bytte bedrift");
    } finally {
      setActivating(false);
    }
  }

  return (
    <>
      <ListDetailDetailHeader>
        <div className="flex flex-1 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Icon name="building-2" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{company.name}</p>
            <p className="text-xs text-muted-foreground">
              {workspaceRoleLabels[company.role]}
            </p>
          </div>
        </div>
        {isActive ? (
          <Badge variant="soft-primary" size="sm">
            Aktiv
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleActivate}
            disabled={activating}
          >
            {activating ? "Bytter…" : "Sett som aktiv"}
          </Button>
        )}
      </ListDetailDetailHeader>

      <ListDetailDetailContent>
        <Tabs defaultValue="oversikt">
          <TabsList>
            <TabsTrigger value="oversikt" className="gap-2">
              <Icon name="layout-list" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger value="medlemmer" className="gap-2">
              <Icon name="users" />
              Medlemmer
            </TabsTrigger>
            {canManage && (
              <TabsTrigger value="innstillinger" className="gap-2">
                <Icon name="settings" />
                Innstillinger
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="oversikt" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Om bedriften</CardTitle>
                <CardDescription>
                  {company.description || "Ingen beskrivelse lagt til enda."}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <span className="font-mono">{company.slug}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bedriftsprofil for AI</CardTitle>
                <CardDescription>
                  AI-verktøyene bruker profilen til den aktive bedriften
                  (bransje, målgruppe, mål) for å gi bedre svar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isActive ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/on-poynt/innstillinger/arbeidsomrade">
                      Rediger profil
                    </Link>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sett denne bedriften som aktiv for å redigere profilen som
                    AI-verktøyene bruker.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medlemmer" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Medlemmer</CardTitle>
                <CardDescription>
                  Hvem som har tilgang til denne bedriften.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceMemberList
                  workspaceId={company.id}
                  canManage={canManage}
                  currentUserRole={company.role}
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
                  <WorkspaceInviteForm workspaceId={company.id} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {canManage && (
            <TabsContent value="innstillinger" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Generelle innstillinger</CardTitle>
                  <CardDescription>
                    Oppdater bedriftens grunnleggende informasjon.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkspaceGeneralForm workspace={company} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </ListDetailDetailContent>
    </>
  );
}
