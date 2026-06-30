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
  Input,
  Label,
  Skeleton,
  cn,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useQuery } from "@tanstack/react-query";
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
 * «Ny melding» — velg ett medlem for en DM, eller flere for en gruppe.
 */
export function NewConversationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [groupName, setGroupName] = useState("");
  const [saving, setSaving] = useState(false);

  const membersQuery = useQuery({
    queryKey: ["chat", "members", search],
    queryFn: () => trpc.chat.listMembers.query(search ? { search } : undefined),
    enabled: open,
  });
  const members = membersQuery.data ?? [];
  const selectedIds = Object.keys(selected);
  const isGroup = selectedIds.length > 1;

  function reset() {
    setSearch("");
    setSelected({});
    setGroupName("");
  }

  function toggle(id: string, name: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = name;
      }
      return next;
    });
  }

  async function submit() {
    if (selectedIds.length === 0 || saving) return;
    if (isGroup && groupName.trim().length < 2) {
      toast.error("Gi gruppa et navn.");
      return;
    }
    setSaving(true);
    try {
      const result = isGroup
        ? await trpc.chat.createGroup.mutate({
            name: groupName.trim(),
            memberIds: selectedIds,
          })
        : await trpc.chat.createDm.mutate({ userId: selectedIds[0] as string });
      onOpenChange(false);
      reset();
      onCreated(result.id);
    } catch {
      toast.error("Kunne ikke opprette samtalen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny melding</DialogTitle>
          <DialogDescription>
            Velg én person for en direktemelding, eller flere for en gruppe.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter medlem …"
          />

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => (
                <span
                  key={id}
                  className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-1 pl-2.5 text-primary text-xs"
                >
                  {selected[id]}
                  <button
                    type="button"
                    aria-label="Fjern"
                    onClick={() => toggle(id, selected[id] as string)}
                    className="inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/20"
                  >
                    <Icon name="x" className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto rounded-xl border">
            {membersQuery.isLoading ? (
              <div className="flex flex-col gap-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : members.length === 0 ? (
              <p className="p-4 text-center text-muted-foreground text-sm">
                Ingen medlemmer funnet.
              </p>
            ) : (
              <ul className="divide-y">
                {members.map((m) => {
                  const checked = !!selected[m.id];
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(m.id, m.name)}
                        className="flex w-full items-center gap-3 p-2.5 text-left hover:bg-accent/50"
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
                        <Avatar className="size-8">
                          {m.image && <AvatarImage src={m.image} />}
                          <AvatarFallback className="text-xs">
                            {initials(m.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm">{m.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {isGroup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="group-name">Gruppenavn</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="f.eks. Markedsføring-gjengen"
                maxLength={60}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Avbryt
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving || selectedIds.length === 0}
          >
            {saving && <Icon name="loader" className="size-4 animate-spin" />}
            {isGroup ? "Opprett gruppe" : "Start samtale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
