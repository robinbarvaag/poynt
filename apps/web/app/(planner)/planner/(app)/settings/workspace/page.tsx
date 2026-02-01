"use client";
import { Building2, Users, Mail, Crown, Shield, User, Eye, Briefcase } from "@poynt/ui/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Skeleton } from "@poynt/ui";
import { trpc } from "@/lib/planner/trpc";
import { WorkspaceGeneralForm } from "@/components/workspace/general-form";
import { WorkspaceMemberList } from "@/components/workspace/member-list";
import { WorkspaceInviteForm } from "@/components/workspace/invite-form";
import { WorkspaceProfileForm } from "@/components/workspace/profile-form";
import { useEffect, useState } from "react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role?: "owner" | "admin" | "member" | "client";
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"owner" | "admin" | "member" | "client">("member");

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const current = await trpc.workspace.getCurrentWorkspace.query();
        if (current) {
          const full = await trpc.workspace.getById.query({ id: current.id });
          setWorkspace(full as Workspace);
          setUserRole(full.role);
        }
      } catch (error) {
        console.error("Failed to load workspace:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkspace();
  }, []);

  const canManageMembers = userRole === "owner" || userRole === "admin";
  const canEditSettings = userRole === "owner" || userRole === "admin";

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
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

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="size-8" />
          {workspace.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Administrer innstillinger og medlemmer for denne bedriften.
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          {userRole === "owner" && (
            <>
              <Crown className="size-4 text-yellow-500" />
              <span>Du er eier</span>
            </>
          )}
          {userRole === "admin" && (
            <>
              <Shield className="size-4 text-blue-500" />
              <span>Du er administrator</span>
            </>
          )}
          {userRole === "member" && (
            <>
              <User className="size-4" />
              <span>Du er medlem</span>
            </>
          )}
          {userRole === "client" && (
            <>
              <Eye className="size-4" />
              <span>Du er kunde (begrenset tilgang)</span>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="size-4" />
            Generelt
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <Briefcase className="size-4" />
            Profil
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="size-4" />
            Medlemmer
          </TabsTrigger>
          {canManageMembers && (
            <TabsTrigger value="invite" className="gap-2">
              <Mail className="size-4" />
              Inviter
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Generelle innstillinger</CardTitle>
              <CardDescription>
                Oppdater bedriftens grunnleggende informasjon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceGeneralForm
                workspace={workspace}
                disabled={!canEditSettings}
                onUpdate={(updated) => setWorkspace({ ...workspace, ...updated })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Bedriftsprofil</CardTitle>
              <CardDescription>
                Informasjon som brukes av AI-verktøyene for å gi bedre svar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceProfileForm disabled={!canEditSettings} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Medlemmer</CardTitle>
              <CardDescription>
                Se hvem som har tilgang til denne bedriften.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkspaceMemberList
                workspaceId={workspace.id}
                canManage={canManageMembers}
                currentUserRole={userRole}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {canManageMembers && (
          <TabsContent value="invite">
            <Card>
              <CardHeader>
                <CardTitle>Inviter medlemmer</CardTitle>
                <CardDescription>
                  Send invitasjoner til nye medlemmer eller kunder.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkspaceInviteForm workspaceId={workspace.id} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
