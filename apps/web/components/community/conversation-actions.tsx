"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  cn,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Handlinger for en gruppe: se/legg til medlemmer, gi nytt navn, forlat.
 * Rendres kun for grupper.
 */
export function ConversationActions({
  conversation,
  onLeft,
}: {
  conversation: { id: string; type: string; name: string };
  onLeft: () => void;
}) {
  const queryClient = useQueryClient();
  const [membersOpen, setMembersOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  if (conversation.type !== "group") return null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Gruppehandlinger"
          >
            <Icon name="more-horizontal" className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setMembersOpen(true)}>
            <Icon name="users" className="size-4" />
            Medlemmer
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Icon name="pencil" className="size-4" />
            Gi nytt navn
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setLeaveOpen(true)}
            className="text-destructive"
          >
            <Icon name="log-out" className="size-4" />
            Forlat gruppe
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MembersDialog
        conversationId={conversation.id}
        open={membersOpen}
        onOpenChange={setMembersOpen}
        onChanged={invalidate}
      />
      <RenameDialog
        conversationId={conversation.id}
        currentName={conversation.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onRenamed={invalidate}
      />
      <LeaveDialog
        conversationId={conversation.id}
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onLeft={() => {
          invalidate();
          onLeft();
        }}
      />
    </>
  );
}

function MembersDialog({
  conversationId,
  open,
  onOpenChange,
  onChanged,
}: {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const membersQuery = useQuery({
    queryKey: ["chat", "conversationMembers", conversationId],
    queryFn: () => trpc.chat.getConversationMembers.query({ conversationId }),
    enabled: open,
  });
  const members = membersQuery.data ?? [];
  const memberIds = new Set(members.map((m) => m.user.id));

  const candidatesQuery = useQuery({
    queryKey: ["chat", "members", search],
    queryFn: () => trpc.chat.listMembers.query(search ? { search } : undefined),
    enabled: open,
  });
  const candidates = (candidatesQuery.data ?? []).filter(
    (c) => !memberIds.has(c.id)
  );

  const addMutation = useMutation({
    mutationFn: (memberIdsToAdd: string[]) =>
      trpc.chat.addGroupMembers.mutate({
        conversationId,
        memberIds: memberIdsToAdd,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["chat", "conversationMembers", conversationId],
      });
      setSelected(new Set());
      onChanged();
      toast.success("La til medlemmer.");
    },
    onError: () => toast.error("Kunne ikke legge til medlemmer."),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Medlemmer</DialogTitle>
          <DialogDescription>
            {members.length} medlem{members.length === 1 ? "" : "mer"} i gruppa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <ul className="max-h-40 overflow-y-auto rounded-xl border">
            {members.map((m) => (
              <li
                key={m.user.id}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <Avatar className="size-7">
                  {m.user.image && <AvatarImage src={m.user.image} />}
                  <AvatarFallback className="text-[10px]">
                    {initials(m.user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm">{m.user.name}</span>
                {m.role === "owner" && (
                  <span className="text-muted-foreground text-xs">Eier</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <p className="font-medium text-sm">Legg til</p>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk etter medlem …"
            />
            <div className="max-h-40 overflow-y-auto rounded-xl border">
              {candidates.length === 0 ? (
                <p className="p-3 text-center text-muted-foreground text-sm">
                  Ingen flere å legge til.
                </p>
              ) : (
                <ul className="divide-y">
                  {candidates.map((c) => {
                    const checked = selected.has(c.id);
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => toggle(c.id)}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent/50"
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-md border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input"
                            )}
                          >
                            {checked && (
                              <Icon name="check" className="size-3.5" />
                            )}
                          </span>
                          <span className="truncate text-sm">{c.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={selected.size === 0 || addMutation.isPending}
            onClick={() => addMutation.mutate(Array.from(selected))}
          >
            {addMutation.isPending && (
              <Icon name="loader" className="size-4 animate-spin" />
            )}
            Legg til {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({
  conversationId,
  currentName,
  open,
  onOpenChange,
  onRenamed,
}: {
  conversationId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRenamed: () => void;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Gi gruppa et navn.");
      return;
    }
    setSaving(true);
    try {
      await trpc.chat.renameConversation.mutate({
        conversationId,
        name: name.trim(),
      });
      onOpenChange(false);
      onRenamed();
    } catch {
      toast.error("Kunne ikke gi nytt navn.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gi gruppa nytt navn</DialogTitle>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          autoFocus
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Avbryt
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Icon name="loader" className="size-4 animate-spin" />}
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveDialog({
  conversationId,
  open,
  onOpenChange,
  onLeft,
}: {
  conversationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeft: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  async function leave() {
    setLeaving(true);
    try {
      await trpc.chat.leaveConversation.mutate({ conversationId });
      onOpenChange(false);
      onLeft();
    } catch {
      toast.error("Kunne ikke forlate gruppa.");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forlate gruppa?</DialogTitle>
          <DialogDescription>
            Du slutter å motta meldinger herfra og forsvinner fra medlemslista.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={leaving}
          >
            Avbryt
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={leave}
            disabled={leaving}
          >
            {leaving && <Icon name="loader" className="size-4 animate-spin" />}
            Forlat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
