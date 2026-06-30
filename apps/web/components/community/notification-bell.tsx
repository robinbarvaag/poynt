"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { PushToggle } from "./push-toggle";

type Notification = Awaited<
  ReturnType<typeof trpc.chat.listNotifications.query>
>[number];

const dateFmt = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function conversationLabel(conversation: Notification["conversation"]): string {
  if (!conversation) return "";
  if (conversation.type === "channel") return `# ${conversation.name ?? ""}`;
  return conversation.name ?? "samtalen";
}

function notificationText(n: Notification): string {
  const who = n.actor?.name ?? "Noen";
  if (n.type === "mention") {
    const where = n.conversation
      ? ` i ${conversationLabel(n.conversation)}`
      : "";
    return `${who} nevnte deg${where}`;
  }
  return `${who} sendte deg en melding`;
}

/**
 * Varsel-bjelle i toppbaren — omtaler og DM-er, polling-drevet (ingen eksterne
 * tjenester). Åpning markerer alt som lest.
 */
export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const countQuery = useQuery({
    queryKey: ["chat", "notificationCount"],
    queryFn: () => trpc.chat.unreadNotificationCount.query(),
    refetchInterval: 30_000,
  });
  const count = countQuery.data?.total ?? 0;

  const listQuery = useQuery({
    queryKey: ["chat", "notifications"],
    queryFn: () => trpc.chat.listNotifications.query(undefined),
    enabled: open,
  });
  const notifications = listQuery.data ?? [];

  const markRead = useMutation({
    mutationFn: () => trpc.chat.markNotificationsRead.mutate(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["chat", "notificationCount"],
      }),
  });

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && count > 0) markRead.mutate();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="Varsler"
          className="relative"
        >
          <Icon name="bell" className="size-4" />
          {count > 0 && (
            <span className="-right-0.5 -top-0.5 absolute flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-semibold text-[10px] text-primary-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-3 pt-2">Varsler</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {listQuery.isLoading ? (
          <p className="px-2 py-6 text-center text-muted-foreground text-sm">
            Laster …
          </p>
        ) : notifications.length === 0 ? (
          <p className="px-2 py-6 text-center text-muted-foreground text-sm">
            Ingen varsler ennå.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={
                  n.conversationId
                    ? `/on-poynt/fellesskap?c=${n.conversationId}`
                    : "/on-poynt/fellesskap"
                }
                onClick={() => setOpen(false)}
                className="flex items-start gap-2.5 px-2 py-2 hover:bg-accent/60"
              >
                <Avatar className="mt-0.5 size-7 shrink-0">
                  {n.actor?.image && <AvatarImage src={n.actor.image} />}
                  <AvatarFallback className="text-[10px]">
                    {initials(n.actor?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm leading-snug">
                    {notificationText(n)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {dateFmt.format(new Date(n.createdAt))}
                  </span>
                </span>
                {!n.readAt && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <PushToggle />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
