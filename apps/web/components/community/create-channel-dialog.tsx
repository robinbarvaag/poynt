"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useState } from "react";

/**
 * Admin-dialog for å opprette en ny kanal i fellesskapet.
 */
export function CreateChannelDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function create() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Gi kanalen et navn.");
      return;
    }
    setSaving(true);
    try {
      const channel = await trpc.chat.createChannel.mutate({
        name: trimmed,
        description: description.trim() || undefined,
      });
      toast.success(`Kanalen «${channel?.name}» er opprettet.`);
      setName("");
      setDescription("");
      onOpenChange(false);
      if (channel?.id) onCreated(channel.id);
    } catch {
      toast.error("Kunne ikke opprette kanalen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny kanal</DialogTitle>
          <DialogDescription>
            Kanaler er åpne for alle medlemmer i fellesskapet.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-name">Navn</Label>
            <Input
              id="channel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="f.eks. Generelt"
              maxLength={60}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="channel-desc">Beskrivelse (valgfritt)</Label>
            <Textarea
              id="channel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Hva handler kanalen om?"
              maxLength={280}
              rows={2}
            />
          </div>
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
          <Button type="button" onClick={create} disabled={saving}>
            {saving && <Icon name="loader" className="size-4 animate-spin" />}
            Opprett kanal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
