"use client";

import { trpc } from "@/lib/planner/trpc";
import { workspaceRoleLabels } from "@poynt/planner-validators";
import { Avatar, AvatarFallback, AvatarImage } from "@poynt/ui";
import { Button } from "@poynt/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@poynt/ui";
import { Skeleton } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import * as React from "react";

interface Member {
  id: string;
  role: "owner" | "admin" | "member" | "client";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface WorkspaceMemberListProps {
  workspaceId: string;
  canManage: boolean;
  currentUserRole: "owner" | "admin" | "member" | "client";
}

type MemberRole = "owner" | "admin" | "member" | "client";

const roleIcons: Record<MemberRole, IconName> = {
  owner: "crown",
  admin: "shield",
  member: "user",
  client: "eye",
};

const roleColors: Record<MemberRole, string> = {
  owner: "text-yellow-500",
  admin: "text-blue-500",
  member: "text-muted-foreground",
  client: "text-muted-foreground",
};

export function WorkspaceMemberList({
  workspaceId,
  canManage,
  currentUserRole,
}: WorkspaceMemberListProps) {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadMembers() {
      try {
        const data = await trpc.workspace.getMembers.query({ workspaceId });
        setMembers(data as Member[]);
      } catch (error) {
        console.error("Failed to load members:", error);
        toast.error("Kunne ikke laste medlemmer");
      } finally {
        setIsLoading(false);
      }
    }
    loadMembers();
  }, [workspaceId]);

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Er du sikker på at du vil fjerne ${userName}?`)) {
      return;
    }

    try {
      await trpc.workspace.removeMember.mutate({ workspaceId, userId });
      setMembers((prev) => prev.filter((m) => m.user.id !== userId));
      toast.success(`${userName} ble fjernet`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Kunne ikke fjerne medlem";
      toast.error(errorMessage);
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "member" | "client"
  ) => {
    try {
      await trpc.workspace.updateMemberRole.mutate({
        workspaceId,
        userId,
        role: newRole,
      });
      setMembers((prev) =>
        prev.map((m) => (m.user.id === userId ? { ...m, role: newRole } : m))
      );
      toast.success("Rolle oppdatert");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Kunne ikke oppdatere rolle";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Ingen medlemmer funnet.</p>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const roleIcon = roleIcons[member.role];
        const canEditThisMember =
          canManage &&
          member.role !== "owner" &&
          (currentUserRole === "owner" ||
            (currentUserRole === "admin" && member.role !== "admin"));

        return (
          <div key={member.id} className="flex items-center gap-4 py-2">
            <Avatar>
              <AvatarImage src={member.user.image ?? undefined} />
              <AvatarFallback>
                {member.user.name?.slice(0, 2).toUpperCase() ?? "??"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{member.user.name}</span>
                <Icon
                  name={roleIcon}
                  className={`size-4 ${roleColors[member.role]}`}
                />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {member.user.email}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {workspaceRoleLabels[member.role]}
              </span>

              {canEditThisMember && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Icon name="more-horizontal" className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currentUserRole === "owner" && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateRole(member.user.id, "admin")
                          }
                          disabled={member.role === "admin"}
                        >
                          <Icon name="shield" className="mr-2 size-4" />
                          Gjør til administrator
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateRole(member.user.id, "member")
                          }
                          disabled={member.role === "member"}
                        >
                          <Icon name="user" className="mr-2 size-4" />
                          Gjør til medlem
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleUpdateRole(member.user.id, "client")
                          }
                          disabled={member.role === "client"}
                        >
                          <Icon name="eye" className="mr-2 size-4" />
                          Gjør til kunde
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        handleRemoveMember(member.user.id, member.user.name)
                      }
                      className="text-destructive focus:text-destructive"
                    >
                      <Icon name="trash" className="mr-2 size-4" />
                      Fjern fra bedrift
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
