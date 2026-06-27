"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  cn,
  useSidebar,
} from "@poynt/ui";
import * as React from "react";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  role: "owner" | "admin" | "member" | "client";
}

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] =
    React.useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  // Load workspaces on mount
  React.useEffect(() => {
    async function loadWorkspaces() {
      try {
        const [list, current] = await Promise.all([
          trpc.workspace.list.query(),
          trpc.workspace.getCurrentWorkspace.query(),
        ]);
        setWorkspaces(list as Workspace[]);

        if (current) {
          const activeFromList = list.find(
            (w: Workspace) => w.id === current.id
          );
          setActiveWorkspace(activeFromList || null);
        } else if (list.length > 0) {
          setActiveWorkspace(list[0] as Workspace);
        }
      } catch (error) {
        console.error("Failed to load workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaces();
  }, []);

  const handleSwitchWorkspace = async (workspace: Workspace) => {
    try {
      await trpc.workspace.switchWorkspace.mutate({
        workspaceId: workspace.id,
      });
      setActiveWorkspace(workspace);
      // Reload page to refresh context
      window.location.reload();
    } catch (error) {
      console.error("Failed to switch workspace:", error);
    }
  };

  const handleWorkspaceCreated = () => {
    setShowCreateDialog(false);
    // Den nye bedriften er nå aktiv (satt server-side). Full reload så alle
    // server-komponenter (dashbord, profil) leser den nye bedriftens data —
    // ellers ble den forrige bedriftens innhold hengende igjen.
    window.location.reload();
  };

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="w-full">
            <Skeleton className="size-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // No workspaces - show create button
  if (workspaces.length === 0) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full"
              onClick={() => setShowCreateDialog(true)}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
                <Icon name="plus" className="size-4 text-muted-foreground" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Opprett bedrift</span>
                <span className="truncate text-xs text-muted-foreground">
                  Kom i gang
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <CreateWorkspaceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={handleWorkspaceCreated}
        />
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon name="building-2" className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {activeWorkspace?.name ?? "Velg bedrift"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activeWorkspace?.role === "owner"
                      ? "Eier"
                      : activeWorkspace?.role === "admin"
                        ? "Administrator"
                        : activeWorkspace?.role === "client"
                          ? "Kunde"
                          : "Medlem"}
                  </span>
                </div>
                <Icon name="chevrons-up-down" className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace)}
                  className="cursor-pointer gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border bg-background">
                    <Icon name="building-2" className="size-4 shrink-0" />
                  </div>
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {activeWorkspace?.id === workspace.id && (
                    <Icon name="check" className="size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowCreateDialog(true)}
                className="cursor-pointer gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Icon name="plus" className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  Opprett ny bedrift
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateWorkspaceDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleWorkspaceCreated}
      />
    </>
  );
}
