"use client";

import {
  type NavItem,
  businessNavItems,
  communityNavItem,
  feedbackNavItem,
  homeNavItem,
  learnNavItems,
  toolNavItems,
  toolboxNavItems,
} from "@/lib/constants";
import { hasAiTools } from "@/lib/membership/has-active-access";
import { trpc } from "@/lib/planner/trpc";
import {
  Icon,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@poynt/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NavUser } from "./nav-user";
import { WorkspaceSwitcher } from "./workspace-switcher";

function NavItemLink({
  item,
  isActive,
  locked,
}: {
  item: NavItem;
  isActive: boolean;
  locked: boolean;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={item.url}>
          <Icon name={item.icon} />
          <span>{item.title}</span>
          {locked && (
            <Icon
              name="sparkles"
              className="ml-auto h-3 w-3 text-muted-foreground/60"
            />
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAiTier, setIsAiTier] = useState<boolean | null>(null);

  useEffect(() => {
    trpc.admin.checkAccess
      .query()
      .then((result) => setIsAdmin(result.isAdmin))
      .catch(() => setIsAdmin(false));

    trpc.membership.getTier
      .query()
      .then((result) => setIsAiTier(hasAiTools(result.tier)))
      .catch(() => setIsAiTier(false));
  }, []);

  // Uleste meldinger i fellesskapet — driver merket på «Fellesskap».
  const unreadQuery = useQuery({
    queryKey: ["chat", "unreadCount"],
    queryFn: () => trpc.chat.unreadCount.query(),
    refetchInterval: 30_000,
  });
  const unread = unreadQuery.data?.total ?? 0;

  const isItemActive = (url: string) =>
    pathname === url || pathname.startsWith(`${url}/`);

  const renderItem = (item: NavItem) => (
    <NavItemLink
      key={item.title}
      item={item}
      isActive={isItemActive(item.url)}
      locked={!!item.requiresAi && isAiTier === false}
    />
  );

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {/* Hjem + Fellesskap — alene øverst, ikke «verktøy» */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderItem(homeNavItem)}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(communityNavItem.url)}
                >
                  <Link href={communityNavItem.url}>
                    <Icon name={communityNavItem.icon} />
                    <span>{communityNavItem.title}</span>
                  </Link>
                </SidebarMenuButton>
                {unread > 0 && (
                  <SidebarMenuBadge>
                    {unread > 99 ? "99+" : unread}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup data-tour="nav-tools">
          <SidebarGroupLabel>Verktøy</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{toolNavItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Verktøykassa</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{toolboxNavItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup data-tour="nav-learn">
          <SidebarGroupLabel>Læring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{learnNavItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup data-tour="nav-business">
          <SidebarGroupLabel>Din bedrift</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{businessNavItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItem(feedbackNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/on-poynt/admin"}
                    >
                      <Link href="/on-poynt/admin" className="text-primary">
                        <Icon name="shield" />
                        <span>Admin</span>
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname.startsWith(
                            "/on-poynt/admin/tilbakemeldinger"
                          )}
                        >
                          <Link href="/on-poynt/admin/tilbakemeldinger">
                            <Icon name="message-square" />
                            <span>Tilbakemeldinger</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={pathname.startsWith("/on-poynt/lab")}
                        >
                          <Link href="/on-poynt/lab">
                            <Icon name="sparkles" />
                            <span>Modell-lab</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
