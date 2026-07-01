"use client";

import { trpc } from "@/lib/planner/trpc";
import type { MessageAttachmentInput } from "@poynt/planner-validators";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Textarea,
  cn,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { formatSize } from "./helpers";

type Pending = {
  id: string;
  fileName: string;
  sizeBytes: number;
  data?: MessageAttachmentInput;
  uploading: boolean;
  /** Lokal forhåndsvisning (objectURL) for bilder. */
  previewUrl?: string;
};

type MentionState = { atIndex: number; query: string; caret: number };

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
 * Skrivefelt for fellesskapet: tekst, @-omtaler og vedlegg. Laster opp filer til
 * `/api/on-poynt/community-upload` og leverer ferdige `attachments` +
 * `mentionUserIds` til `onSend`.
 */
export function Composer({
  onSend,
  disabled,
  placeholder = "Skriv en melding …",
  replyTo,
  onCancelReply,
  frameless = false,
}: {
  onSend: (input: {
    body: string;
    attachments: MessageAttachmentInput[];
    mentionUserIds: string[];
  }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  replyTo?: { authorName: string; body: string | null } | null;
  onCancelReply?: () => void;
  /** Uten border/bakgrunn — for bruk inni et kort (f.eks. nytt innlegg). */
  frameless?: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [sending, setSending] = useState(false);
  const [mention, setMention] = useState<MentionState | null>(null);
  const [highlight, setHighlight] = useState(0);
  // userId → navn for alle som er nevnt (filtreres mot teksten ved sending).
  const mentionsRef = useRef<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const membersQuery = useQuery({
    queryKey: ["chat", "members", ""],
    queryFn: () => trpc.chat.listMembers.query(undefined),
  });
  const members = membersQuery.data ?? [];

  const suggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [members, mention]);

  const ready = pending.every((p) => !p.uploading);
  const hasContent = body.trim().length > 0 || pending.length > 0;

  function detectMention(value: string, caret: number) {
    const before = value.slice(0, caret);
    const m = before.match(/(?:^|\s)@([\p{L}0-9_]*)$/u);
    if (!m) {
      setMention(null);
      return;
    }
    const query = m[1] ?? "";
    setMention({ atIndex: caret - query.length - 1, query, caret });
    setHighlight(0);
  }

  function selectMember(member: { id: string; name: string }) {
    if (!mention) return;
    const before = body.slice(0, mention.atIndex);
    const after = body.slice(mention.caret);
    const insert = `@${member.name} `;
    const next = before + insert + after;
    mentionsRef.current[member.id] = member.name;
    setBody(next);
    setMention(null);
    const pos = (before + insert).length;
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const id = `${file.name}-${file.size}-${pending.length}-${Math.round(
        file.lastModified
      )}`;
      const previewUrl = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      setPending((p) => [
        ...p,
        {
          id,
          fileName: file.name,
          sizeBytes: file.size,
          uploading: true,
          previewUrl,
        },
      ]);

      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/on-poynt/community-upload", {
          method: "POST",
          body: form,
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Opplasting feilet");
        }
        setPending((p) =>
          p.map((item) =>
            item.id === id
              ? {
                  ...item,
                  uploading: false,
                  data: {
                    url: json.url,
                    fileName: json.fileName,
                    mimeType: json.mimeType,
                    sizeBytes: json.sizeBytes,
                  },
                }
              : item
          )
        );
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Opplasting feilet"
        );
        setPending((p) => p.filter((item) => item.id !== id));
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (!hasContent || !ready || sending || disabled) return;
    const attachments = pending
      .map((p) => p.data)
      .filter((d): d is MessageAttachmentInput => Boolean(d));
    // Behold kun omtaler som faktisk står igjen i teksten.
    const mentionUserIds = Object.entries(mentionsRef.current)
      .filter(([, name]) => body.includes(`@${name}`))
      .map(([id]) => id);

    setSending(true);
    try {
      await onSend({ body: body.trim(), attachments, mentionUserIds });
      for (const p of pending) {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      }
      setBody("");
      setPending([]);
      mentionsRef.current = {};
      setMention(null);
    } catch {
      toast.error("Kunne ikke sende meldingen.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        "relative shrink-0 p-3",
        frameless ? "bg-transparent" : "border-t bg-card"
      )}
    >
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-primary border-l-2 bg-muted/40 py-1.5 pr-1 pl-2.5 text-sm">
          <Icon name="message-square" className="size-3.5 text-primary" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium text-xs">
              Svarer {replyTo.authorName}
            </span>
            <span className="truncate text-muted-foreground text-xs">
              {replyTo.body ?? "📎 Vedlegg"}
            </span>
          </span>
          <button
            type="button"
            aria-label="Avbryt svar"
            onClick={onCancelReply}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          >
            <Icon name="x" className="size-3.5" />
          </button>
        </div>
      )}

      {mention && suggestions.length > 0 && (
        <div className="absolute bottom-full left-3 z-20 mb-2 w-72 overflow-hidden rounded-xl border bg-popover shadow-md">
          {suggestions.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectMember(m);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm",
                i === highlight ? "bg-accent" : "hover:bg-accent/60"
              )}
            >
              <Avatar className="size-6">
                {m.image && <AvatarImage src={m.image} />}
                <AvatarFallback className="text-[10px]">
                  {initials(m.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      )}

      {pending.length > 0 && (
        <AttachmentGroup className="mb-2">
          {pending.map((p) => (
            // Bilder: stående kort med stor forhåndsvisning (shadcn-stil).
            // Andre filer: liggende brikke med ikon. Shimmer mens de laster opp.
            <Attachment
              key={p.id}
              size={p.previewUrl ? "default" : "sm"}
              state={p.uploading ? "uploading" : "done"}
              orientation={p.previewUrl ? "vertical" : "horizontal"}
              className={p.previewUrl ? undefined : "w-56"}
            >
              <AttachmentMedia
                variant={p.previewUrl ? "image" : "icon"}
                className={
                  p.previewUrl ? undefined : "bg-primary/10 text-primary"
                }
              >
                {p.previewUrl ? (
                  <img src={p.previewUrl} alt={p.fileName} />
                ) : p.uploading ? (
                  <Icon name="loader" className="animate-spin" />
                ) : (
                  <Icon name="file-text" />
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{p.fileName}</AttachmentTitle>
                <AttachmentDescription>
                  {p.uploading ? "Laster opp …" : formatSize(p.sizeBytes)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction
                  type="button"
                  aria-label="Fjern vedlegg"
                  className={
                    p.previewUrl
                      ? "bg-background/80 shadow-sm backdrop-blur-sm hover:bg-background"
                      : undefined
                  }
                  onClick={() => {
                    if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
                    setPending((items) => items.filter((i) => i.id !== p.id));
                  }}
                >
                  <Icon name="x" />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
        </AttachmentGroup>
      )}

      <div className="flex items-end gap-1 rounded-2xl border bg-background p-1.5 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {/* size-9 = samme høyde som tekstfeltets min-h → flukter i items-end-raden. */}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0 rounded-full"
          aria-label="Legg ved fil"
          disabled={disabled || sending}
          onClick={() => fileRef.current?.click()}
        >
          <Icon name="paperclip" className="size-4" />
        </Button>
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            detectMention(e.target.value, e.target.selectionStart ?? 0);
          }}
          onClick={(e) =>
            detectMention(
              e.currentTarget.value,
              e.currentTarget.selectionStart ?? 0
            )
          }
          onKeyDown={(e) => {
            if (mention && suggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => (h + 1) % suggestions.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight(
                  (h) => (h - 1 + suggestions.length) % suggestions.length
                );
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                const choice = suggestions[highlight];
                if (choice) selectMember(choice);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setMention(null);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          className="max-h-40 min-h-9 flex-1 resize-none self-center border-0 bg-transparent px-1.5 py-2 shadow-none focus-visible:ring-0"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send melding"
          className="shrink-0 rounded-full transition-transform hover:scale-105"
          disabled={!hasContent || !ready || sending || disabled}
          onClick={submit}
        >
          {sending ? (
            <Icon name="loader" className="size-4 animate-spin" />
          ) : (
            <Icon name="send" className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
