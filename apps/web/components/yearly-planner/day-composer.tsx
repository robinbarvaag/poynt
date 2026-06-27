"use client";

import {
  CHANNEL_META,
  type ChannelKey,
  SCHEDULED_POST_TOOL_ID,
  SELECTABLE_CHANNELS,
  parseISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import type { GeneratePostRequest } from "@poynt/planner-validators";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useState } from "react";

interface DayComposerProps {
  /** Dagen brukeren trykket på («YYYY-MM-DD»). */
  isoDate: string;
  onClose: () => void;
  /** Start AI-drilldown for et innlegg på denne dagen. */
  onCreateAI: (post: GeneratePostRequest, isoDate: string) => void;
  /** Kalles når et manuelt innlegg er lagret. */
  onSaved: () => void;
}

type Mode = "choice" | "ai" | "manual";

function formatDate(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(p.year, p.month - 1, p.day));
}

function parseHashtags(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^#/, "").trim())
    .filter(Boolean);
}

/**
 * «Hva vil du gjøre?» på en kalenderdag: opprett et innlegg med AI (drilldown)
 * eller manuelt (skriv selv). Ett innlegg lagres på den valgte datoen.
 */
export function DayComposer({
  isoDate,
  onClose,
  onCreateAI,
  onSaved,
}: DayComposerProps) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("choice");
  const [channel, setChannel] = useState<ChannelKey>("linkedin");
  const [idea, setIdea] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setOpen(false);
    onClose();
  };

  const startAI = () => {
    if (!idea.trim()) {
      toast.error("Skriv en kort idé først.");
      return;
    }
    onCreateAI(
      { channel: CHANNEL_META[channel].label, idea: idea.trim() },
      isoDate
    );
    close();
  };

  const saveManual = async () => {
    if (!caption.trim()) {
      toast.error("Skriv en tekst først.");
      return;
    }
    setSaving(true);
    try {
      const tags = parseHashtags(hashtags);
      await trpc.toolResult.save.mutate({
        toolId: SCHEDULED_POST_TOOL_ID,
        title: caption.trim().slice(0, 80),
        inputs: {
          channel: CHANNEL_META[channel].label,
          scheduledDate: isoDate,
        },
        result: {
          caption: caption.trim(),
          hashtags: tags,
          imageTip: null,
          channel: CHANNEL_META[channel].label,
          idea: caption.trim().slice(0, 80),
          scheduledDate: isoDate,
          postType: null,
          source: "manual",
        },
      });
      toast.success("Innlegget er lagret i kalenderen.");
      onSaved();
      close();
    } catch {
      toast.error("Kunne ikke lagre innlegget.");
    } finally {
      setSaving(false);
    }
  };

  const channelSelect = (
    <div className="space-y-1.5">
      <Label>Kanal</Label>
      <Select
        value={channel}
        onValueChange={(v) => setChannel(v as ChannelKey)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Velg kanal" />
        </SelectTrigger>
        <SelectContent>
          {SELECTABLE_CHANNELS.map((key) => (
            <SelectItem key={key} value={key}>
              {CHANNEL_META[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {formatDate(isoDate)}
          </DialogTitle>
          <DialogDescription>
            {mode === "choice" && "Hva vil du gjøre på denne dagen?"}
            {mode === "ai" && "Beskriv idéen — så skriver vi innlegget."}
            {mode === "manual" && "Skriv innlegget selv."}
          </DialogDescription>
        </DialogHeader>

        {mode === "choice" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("ai")}
              className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="sparkles" className="size-5" />
              </div>
              <p className="font-medium text-sm">Opprett med AI</p>
              <p className="text-muted-foreground text-xs">
                Beskriv en idé — vi skriver innlegget i deres stemme.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className="flex flex-col items-start gap-2 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon name="pencil" className="size-5" />
              </div>
              <p className="font-medium text-sm">Opprett manuelt</p>
              <p className="text-muted-foreground text-xs">
                Skriv teksten selv og legg den på dagen.
              </p>
            </button>
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-4">
            {channelSelect}
            <div className="space-y-1.5">
              <Label htmlFor="day-ai-idea">Idé</Label>
              <Textarea
                id="day-ai-idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="F.eks. «Tips om hvordan velge riktig pakke før sommeren»"
                rows={3}
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setMode("choice")}>
                Tilbake
              </Button>
              <Button onClick={startAI} className="gap-2">
                <Icon name="sparkles" className="size-4" />
                Skriv innlegget
              </Button>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="space-y-4">
            {channelSelect}
            <div className="space-y-1.5">
              <Label htmlFor="day-manual-caption">Tekst</Label>
              <Textarea
                id="day-manual-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Skriv innlegget …"
                rows={5}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="day-manual-hashtags">Hashtags (valgfritt)</Label>
              <Input
                id="day-manual-hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#poynt #tips"
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="ghost" onClick={() => setMode("choice")}>
                Tilbake
              </Button>
              <Button onClick={saveManual} disabled={saving} className="gap-2">
                <Icon
                  name={saving ? "loader" : "check"}
                  className={saving ? "size-4 animate-spin" : "size-4"}
                />
                Lagre i kalenderen
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
