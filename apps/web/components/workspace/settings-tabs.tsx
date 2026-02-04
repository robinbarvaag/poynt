"use client";

import type { Workspace } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { WorkspaceGeneralForm } from "./general-form";
import { WorkspaceInviteForm } from "./invite-form";
import { WorkspaceMemberList } from "./member-list";
import { WorkspaceProfileForm } from "./profile-form";

interface WorkspaceSettingsTabsProps {
  workspace: Workspace;
  userRole: "owner" | "admin" | "member" | "client";
}

export function WorkspaceSettingsTabs({
  workspace,
  userRole,
}: WorkspaceSettingsTabsProps) {
  const canManageMembers = userRole === "owner" || userRole === "admin";
  const canEditSettings = userRole === "owner" || userRole === "admin";

  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general" className="gap-2">
          <Icon name="building-2" />
          Generelt
        </TabsTrigger>
        <TabsTrigger value="profile" className="gap-2">
          <Icon name="briefcase" />
          Profil
        </TabsTrigger>
        <TabsTrigger value="members" className="gap-2">
          <Icon name="users" />
          Medlemmer
        </TabsTrigger>
        {canManageMembers && (
          <TabsTrigger value="invite" className="gap-2">
            <Icon name="mail" />
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
  );
}
