"use client";

import { signOut, useSession } from "@poynt/planner-auth/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Icon,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  useSidebar,
} from "@poynt/ui";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push("/planner");
    router.refresh();
  };

  if (isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("") ||
    user.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <Icon name="chevrons-up-down" className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Icon name="user" className="mr-2 h-4 w-4" />
                Profil
              </DropdownMenuItem>
              <div className="flex items-center px-2 py-1.5">
                <span className="flex-1 text-sm">Tema</span>
                <ThemeToggle />
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <Icon name="log-out" className="mr-2 h-4 w-4" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
