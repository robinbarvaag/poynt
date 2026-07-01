"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type MessageAttachmentInput,
  reactionEmojis,
} from "@poynt/planner-validators";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Bubble,
  BubbleContent,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ListDetail,
  ListDetailDetail,
  ListDetailDetailHeader,
  ListDetailEmpty,
  ListDetailList,
  ListDetailListContent,
  ListDetailListHeader,
  ListDetailRow,
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Skeleton,
  Textarea,
  cn,
  toast,
  useIsMobile,
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Composer } from "./composer";
import { ConversationActions } from "./conversation-actions";
import { CreateChannelDialog } from "./create-channel-dialog";
import { FeedView } from "./feed-view";
import {
  ReactionChip,
  avatarColor,
  formatDayLabel,
  formatSize,
  initials,
  renderBody,
  sameDay,
  timeFmt,
} from "./helpers";
import { NewConversationDialog } from "./new-conversation-dialog";

type CurrentUser = { id: string; name: string; image: string | null };

type Conversation = Awaited<
  ReturnType<typeof trpc.chat.listConversations.query>
>[number];
type ChatMessage = Awaited<
  ReturnType<typeof trpc.chat.getMessages.query>
>["messages"][number];

/** Dato-skille mellom meldinger fra ulike dager. */
function DayDivider({ date }: { date: string | Date }) {
  return (
    <div className="flex justify-center py-1">
      <span className="rounded-full bg-muted px-3 py-0.5 text-muted-foreground text-xs">
        {formatDayLabel(date)}
      </span>
    </div>
  );
}

/**
 * Flytende «hvor er jeg»-dato-pille øverst som oppdaterer seg mens man ruller —
 * drevet av shadcn `useMessageScrollerVisibility` (currentAnchorId). Pilla er
 * også en hoppmeny: klikk for å hoppe rett til en annen dag i samtalen, med
 * gjeldende dag uthevet (à la «Transcript Outline»-eksempelet i docs).
 */
function ScrollDateBar({ messages }: { messages: ChatMessage[] }) {
  const { currentAnchorId } = useMessageScrollerVisibility();
  const { scrollToMessage } = useMessageScroller();
  const first = messages[0];
  const lastMsg = messages[messages.length - 1];
  // Første melding per dag — «innholdsfortegnelsen» i hoppmenyen.
  const days = useMemo(() => {
    const out: { label: string; messageId: string }[] = [];
    for (const m of messages) {
      const label = formatDayLabel(m.createdAt);
      if (!out.some((d) => d.label === label)) {
        out.push({ label, messageId: m.id });
      }
    }
    return out;
  }, [messages]);
  // Vis bare når samtalen strekker seg over mer enn én dag — ellers er pilla
  // bare støy (alt er «I dag»).
  const spansDays =
    !!first && !!lastMsg && !sameDay(first.createdAt, lastMsg.createdAt);
  const anchor = messages.find((m) => m.id === currentAnchorId) ?? first;
  if (!spansDays || !anchor) return null;
  const currentLabel = formatDayLabel(anchor.createdAt);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Hopp til dag"
            className="pointer-events-auto flex items-center gap-1 rounded-full bg-background/90 px-3 py-0.5 text-muted-foreground text-xs shadow-sm ring-1 ring-border backdrop-blur transition-colors hover:text-foreground"
          >
            {currentLabel}
            <Icon name="chevron-down" className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-44">
          {days.map((d) => (
            <DropdownMenuItem
              key={d.label}
              onSelect={() =>
                scrollToMessage(d.messageId, {
                  align: "start",
                  behavior: "smooth",
                })
              }
              className={cn(
                d.label === currentLabel && "font-semibold text-primary"
              )}
            >
              <Icon name="calendar" className="size-3.5" />
              {d.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function CommunityClient({ currentUser }: { currentUser: CurrentUser }) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [older, setOlder] = useState<ChatMessage[]>([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  useEffect(() => {
    trpc.admin.checkAccess
      .query()
      .then((r) => setIsAdmin(r.isAdmin))
      .catch(() => setIsAdmin(false));
  }, []);

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => trpc.chat.listConversations.query(),
    refetchInterval: 15_000,
  });
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data]
  );

  // Fellesskapets vegg (innlegg) — fast destinasjon øverst i lista.
  const feedQuery = useQuery({
    queryKey: ["chat", "feed"],
    queryFn: () => trpc.chat.getFeed.query(),
  });
  const feedId = feedQuery.data?.id ?? null;

  // Dyplenke fra varsel-bjella: /on-poynt/fellesskap?c=<id> åpner den samtalen.
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get("c");
  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId);
  }, [deepLinkId]);

  // Auto-velg Innlegg (veggen) på desktop — det er «forsiden» av fellesskapet.
  // På mobil lar vi brukeren velge selv, så vi ikke åpner detalj-arket rett vekk.
  useEffect(() => {
    if (!isMobile && !selectedId && feedId) {
      setSelectedId(feedId);
    }
  }, [isMobile, selectedId, feedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // Medlemsnavn for å utheve @-omtaler i meldingene.
  const membersQuery = useQuery({
    queryKey: ["chat", "members", ""],
    queryFn: () => trpc.chat.listMembers.query(undefined),
  });
  const memberNames = useMemo(
    () => (membersQuery.data ?? []).map((m) => m.name),
    [membersQuery.data]
  );

  // Smart polling: i stedet for å hente hele meldingslista hvert 3. sekund
  // poller vi en billig «versjon» (getActivity) og henter meldinger på nytt
  // KUN når noe faktisk har endret seg (ny/redigert/slettet melding, reaksjon).
  const isFeedSelected = !!selectedId && selectedId === feedId;
  const activityQuery = useQuery({
    queryKey: ["chat", "activity", selectedId],
    queryFn: () =>
      trpc.chat.getActivity.query({ conversationId: selectedId as string }),
    enabled: !!selectedId && !isFeedSelected,
    refetchInterval: 3_000,
  });
  const activityVersion = activityQuery.data?.version;
  const prevVersionRef = useRef<string | undefined>(undefined);
  // biome-ignore lint/correctness/useExhaustiveDependencies: reager kun på versjons-endring
  useEffect(() => {
    if (
      activityVersion &&
      prevVersionRef.current &&
      activityVersion !== prevVersionRef.current
    ) {
      queryClient.invalidateQueries({
        queryKey: ["chat", "messages", selectedId],
      });
    }
    prevVersionRef.current = activityVersion;
  }, [activityVersion]);

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedId],
    queryFn: () =>
      trpc.chat.getMessages.query({ conversationId: selectedId as string }),
    enabled: !!selectedId && !isFeedSelected,
  });
  // Den pollede «siste siden» pluss eldre meldinger lastet på forespørsel.
  const latest = useMemo(
    () => messagesQuery.data?.messages ?? [],
    [messagesQuery.data]
  );
  const messages = useMemo(() => [...older, ...latest], [older, latest]);
  const lastMessageId = latest[latest.length - 1]?.id;

  // Nullstill «eldre»-bufferet + svar-tilstand når man bytter samtale.
  // biome-ignore lint/correctness/useExhaustiveDependencies: selectedId er bevisst en reset-trigger
  useEffect(() => {
    setOlder([]);
    setHasMoreOlder(true);
    setReplyTo(null);
  }, [selectedId]);

  async function loadOlder() {
    if (loadingOlder || !hasMoreOlder || !selectedId) return;
    const cursor = older[0]?.createdAt ?? latest[0]?.createdAt;
    if (!cursor) return;
    setLoadingOlder(true);
    try {
      const res = await trpc.chat.getMessages.query({
        conversationId: selectedId,
        before: new Date(cursor).toISOString(),
      });
      setOlder((prev) => [...res.messages, ...prev]);
      setHasMoreOlder(Boolean(res.nextCursor));
    } catch {
      toast.error("Kunne ikke laste eldre meldinger.");
    } finally {
      setLoadingOlder(false);
    }
  }

  const markRead = useMutation({
    mutationFn: (conversationId: string) =>
      trpc.chat.markRead.mutate({ conversationId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });

  // Marker som lest når en samtale åpnes / nye meldinger kommer inn.
  // biome-ignore lint/correctness/useExhaustiveDependencies: kjør kun når valgt samtale eller siste melding endrer seg
  useEffect(() => {
    if (selectedId && lastMessageId) {
      markRead.mutate(selectedId);
    }
  }, [selectedId, lastMessageId]);

  const invalidateMessages = () =>
    queryClient.invalidateQueries({
      queryKey: ["chat", "messages", selectedId],
    });

  const sendMutation = useMutation({
    mutationFn: (input: {
      conversationId: string;
      body: string;
      attachments: MessageAttachmentInput[];
      mentionUserIds: string[];
      parentMessageId?: string;
    }) =>
      trpc.chat.sendMessage.mutate({
        conversationId: input.conversationId,
        body: input.body || undefined,
        attachments: input.attachments.length ? input.attachments : undefined,
        mentionUserIds: input.mentionUserIds.length
          ? input.mentionUserIds
          : undefined,
        parentMessageId: input.parentMessageId,
      }),
    onSuccess: () => {
      invalidateMessages();
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setReplyTo(null);
    },
  });

  const reactionMutation = useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) =>
      trpc.chat.toggleReaction.mutate(input),
    onSuccess: invalidateMessages,
  });

  const editMutation = useMutation({
    mutationFn: (input: { messageId: string; body: string }) =>
      trpc.chat.editMessage.mutate(input),
    onSuccess: invalidateMessages,
    onError: () => toast.error("Kunne ikke redigere meldingen."),
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      trpc.chat.deleteMessage.mutate({ messageId }),
    onSuccess: invalidateMessages,
    onError: () => toast.error("Kunne ikke slette meldingen."),
  });

  const channels = conversations.filter((c) => c.type === "channel");
  const direct = conversations.filter((c) => c.type !== "channel");

  return (
    <ListDetail
      value={selectedId}
      onValueChange={setSelectedId}
      className="h-full"
      listWidth="22rem"
    >
      <ListDetailList>
        <ListDetailListHeader className="justify-between">
          <span className="flex items-center gap-2 font-semibold text-sm">
            <Icon name="users" className="size-4 text-primary" />
            Fellesskap
          </span>
          <span className="flex items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ny melding"
              title="Ny melding"
              onClick={() => setNewOpen(true)}
            >
              <Icon name="pencil" className="size-4" />
            </Button>
            {isAdmin && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Ny kanal"
                title="Ny kanal"
                onClick={() => setCreateOpen(true)}
              >
                <Icon name="plus" className="size-4" />
              </Button>
            )}
          </span>
        </ListDetailListHeader>

        <ListDetailListContent className="scrollbar-brand">
          {/* Innlegg (veggen) — fast destinasjon øverst, à la Facebook-gruppa. */}
          {feedId && (
            <ListDetailRow value={feedId} className="gap-0">
              <span className="flex w-full items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-1 text-accent-1-foreground">
                  <Icon name="newspaper" className="size-4" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">Innlegg</span>
                  <span className="truncate text-muted-foreground text-xs">
                    Fellesskapets vegg — del, spør og feir
                  </span>
                </span>
              </span>
            </ListDetailRow>
          )}

          {conversationsQuery.isLoading ? (
            <div className="flex flex-col gap-2 p-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-1.5">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Ingen kanaler ennå.
            </div>
          ) : (
            <>
              {channels.length > 0 && (
                <ConversationSection label="Kanaler" items={channels} />
              )}
              {direct.length > 0 && (
                <ConversationSection label="Meldinger" items={direct} />
              )}
            </>
          )}
        </ListDetailListContent>
      </ListDetailList>

      <ListDetailDetail
        className="bg-background"
        empty={
          <ListDetailEmpty>
            <Icon name="message-square" className="size-10 opacity-40" />
            <p className="font-medium">Velg en samtale</p>
            <p className="text-sm">Bli med i praten med de andre medlemmene.</p>
          </ListDetailEmpty>
        }
      >
        {isFeedSelected ? (
          <>
            <ListDetailDetailHeader>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-1 text-accent-1-foreground">
                <Icon name="newspaper" className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-sm">Innlegg</span>
                <span className="truncate text-muted-foreground text-xs">
                  Fellesskapets vegg — del, spør og feir
                </span>
              </div>
            </ListDetailDetailHeader>
            <FeedView currentUser={currentUser} memberNames={memberNames} />
          </>
        ) : null}
        {!isFeedSelected && selected && (
          <>
            <ListDetailDetailHeader>
              <ConversationIcon conversation={selected} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-sm">
                  {selected.type === "channel"
                    ? `# ${selected.name}`
                    : selected.name}
                </span>
                {selected.description && (
                  <span className="truncate text-muted-foreground text-xs">
                    {selected.description}
                  </span>
                )}
              </div>
              <div className="ml-auto">
                <ConversationActions
                  conversation={selected}
                  onLeft={() => setSelectedId(null)}
                />
              </div>
            </ListDetailDetailHeader>

            {messagesQuery.isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <span className="shimmer text-muted-foreground text-sm">
                  Laster meldinger …
                </span>
              </div>
            ) : (
              // shadcn message-scroller: auto-scroll til bunns, bevart scroll-
              // posisjon ved prepend, scroll-til-bunns-FAB + lese-posisjon-pille.
              <div className="flex min-h-0 flex-1 flex-col">
                <MessageScrollerProvider autoScroll>
                  <MessageScroller className="min-h-0 flex-1">
                    <ScrollDateBar messages={messages} />
                    <MessageScrollerViewport
                      preserveScrollOnPrepend
                      className="scrollbar-brand p-4"
                    >
                      <MessageScrollerContent className="gap-0.5">
                        {messages.length === 0 ? (
                          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center text-muted-foreground">
                            <Icon
                              name="megaphone"
                              className="size-8 opacity-40"
                            />
                            <p className="text-sm">
                              Ingen meldinger ennå — vær den første!
                            </p>
                          </div>
                        ) : (
                          <>
                            {hasMoreOlder && messages.length >= 50 && (
                              <div className="flex justify-center pb-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={loadingOlder}
                                  onClick={loadOlder}
                                >
                                  {loadingOlder ? (
                                    <Icon
                                      name="loader"
                                      className="size-4 animate-spin"
                                    />
                                  ) : (
                                    "Last eldre meldinger"
                                  )}
                                </Button>
                              </div>
                            )}
                            {messages.map((m, i) => {
                              const prev = messages[i - 1];
                              const next = messages[i + 1];
                              const showDay =
                                !prev || !sameDay(prev.createdAt, m.createdAt);
                              // Ny blokk: dag-skille eller ny avsender.
                              const startsRun =
                                showDay ||
                                !prev ||
                                prev.author.id !== m.author.id;
                              // Slutt på blokk: siste melding, ny avsender etter,
                              // eller dag-skille etter → avataren vises her.
                              const endsRun =
                                !next ||
                                next.author.id !== m.author.id ||
                                !sameDay(m.createdAt, next.createdAt);
                              return (
                                <MessageScrollerItem
                                  key={m.id}
                                  messageId={m.id}
                                  // scrollAnchor kreves for at primitivets
                                  // lese-posisjon (currentAnchorId) skal spore.
                                  scrollAnchor
                                  className={startsRun ? "mt-3" : undefined}
                                >
                                  {showDay && <DayDivider date={m.createdAt} />}
                                  <MessageRow
                                    message={m}
                                    isMe={m.author.id === currentUser.id}
                                    startsRun={startsRun}
                                    endsRun={endsRun}
                                    memberNames={memberNames}
                                    onReact={(messageId, emoji) =>
                                      reactionMutation.mutate({
                                        messageId,
                                        emoji,
                                      })
                                    }
                                    onReply={setReplyTo}
                                    onEdit={(messageId, body) =>
                                      editMutation.mutate({ messageId, body })
                                    }
                                    onDelete={(messageId) =>
                                      deleteMutation.mutate(messageId)
                                    }
                                  />
                                </MessageScrollerItem>
                              );
                            })}
                          </>
                        )}
                      </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton direction="end" />
                  </MessageScroller>
                </MessageScrollerProvider>
              </div>
            )}

            <Composer
              disabled={sendMutation.isPending}
              replyTo={
                replyTo
                  ? {
                      authorName: replyTo.author.name,
                      body: replyTo.body,
                    }
                  : null
              }
              onCancelReply={() => setReplyTo(null)}
              placeholder={
                selected.type === "channel"
                  ? `Melding til # ${selected.name} …`
                  : `Melding til ${selected.name} …`
              }
              onSend={async ({ body, attachments, mentionUserIds }) => {
                await sendMutation.mutateAsync({
                  conversationId: selected.id,
                  body,
                  attachments,
                  mentionUserIds,
                  parentMessageId: replyTo?.id,
                });
              }}
            />
          </>
        )}
      </ListDetailDetail>

      <CreateChannelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          queryClient.invalidateQueries({
            queryKey: ["chat", "conversations"],
          });
          setSelectedId(id);
        }}
      />

      <NewConversationDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => {
          queryClient.invalidateQueries({
            queryKey: ["chat", "conversations"],
          });
          setSelectedId(id);
        }}
      />
    </ListDetail>
  );
}

function ConversationIcon({
  conversation,
}: {
  conversation: Conversation;
}) {
  if (conversation.type === "channel") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
        #
      </span>
    );
  }
  if (conversation.type === "group") {
    return (
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon name="users" className="size-4" />
      </span>
    );
  }
  return (
    <Avatar className="size-9 shrink-0">
      {conversation.image && <AvatarImage src={conversation.image} />}
      <AvatarFallback
        className={cn("font-semibold", avatarColor(conversation.id))}
      >
        {initials(conversation.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function ConversationSection({
  label,
  items,
}: {
  label: string;
  items: Conversation[];
}) {
  return (
    <div className="mb-1">
      <p className="px-3 pt-2 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      {items.map((c) => (
        <ListDetailRow key={c.id} value={c.id} className="gap-0">
          <span className="flex w-full items-center gap-3">
            <ConversationIcon conversation={c} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium">
                  {c.type === "channel" ? `# ${c.name}` : c.name}
                </span>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-semibold text-[11px] text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </span>
              <span className="truncate text-muted-foreground text-xs">
                {c.lastMessage
                  ? `${
                      c.lastMessage.authorName.split(" ")[0]
                    }: ${preview(c.lastMessage.body)}`
                  : "Ingen meldinger ennå"}
              </span>
            </span>
          </span>
        </ListDetailRow>
      ))}
    </div>
  );
}

function preview(body: string | null): string {
  if (!body) return "📎 Vedlegg";
  return body.length > 48 ? `${body.slice(0, 48)}…` : body;
}

type MessageRowProps = {
  message: ChatMessage;
  isMe: boolean;
  startsRun: boolean;
  endsRun: boolean;
  memberNames: string[];
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: string, body: string) => void;
  onDelete: (messageId: string) => void;
};

function MessageRow({
  message: m,
  isMe,
  startsRun,
  endsRun,
  memberNames,
  onReact,
  onReply,
  onEdit,
  onDelete,
}: MessageRowProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(m.body ?? "");
  const { scrollToMessage } = useMessageScroller();

  function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(m.id, trimmed);
    setEditing(false);
  }

  return (
    <Message align={isMe ? "end" : "start"}>
      {/* bg-transparent: shadcn-wrapperen har bg-muted, som ellers vises som en
          grå «spøkelses-sirkel» på plassholderne midt i en blokk. */}
      <MessageAvatar className="bg-transparent">
        {/* Avatar vises ÉN gang per blokk — nederst (self-end), à la Messenger. */}
        {endsRun ? (
          <Avatar className="size-8 ring-2 ring-card">
            {m.author.image && <AvatarImage src={m.author.image} />}
            <AvatarFallback
              className={cn(
                "font-semibold text-[11px]",
                avatarColor(m.author.id)
              )}
            >
              {initials(m.author.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="block size-8" />
        )}
      </MessageAvatar>
      <MessageContent>
        {startsRun && (
          <MessageHeader className={cn("gap-2", isMe && "flex-row-reverse")}>
            <span className="font-semibold text-foreground">
              {isMe ? "Du" : m.author.name}
            </span>
            <span>{timeFmt.format(new Date(m.createdAt))}</span>
          </MessageHeader>
        )}

        {editing ? (
          // Redigering aligner med selve meldingen (høyre for egne).
          <div
            className={cn(
              "flex w-full max-w-md flex-col gap-1.5",
              isMe && "self-end"
            )}
          >
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  saveEdit();
                }
                if (e.key === "Escape") setEditing(false);
              }}
              rows={2}
              className="resize-none"
            />
            <div className={cn("flex gap-2", isMe && "justify-end")}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditText(m.body ?? "");
                  setEditing(false);
                }}
              >
                Avbryt
              </Button>
              <Button type="button" size="sm" onClick={saveEdit}>
                Lagre
              </Button>
            </div>
          </div>
        ) : (
          (m.body || m.replyTo) && (
            // Sitat + boble er ÉN visuell enhet: sitatet stikker opp bak bobla
            // (negativ mb + bobla malt over), så det er tydelig hva svaret
            // hører til. Klikk på sitatet hopper til originalmeldingen.
            <div
              className={cn(
                "flex w-fit max-w-full flex-col",
                isMe ? "items-end self-end" : "items-start self-start"
              )}
            >
              {m.replyTo && (
                <button
                  type="button"
                  title="Gå til meldingen"
                  onClick={() => {
                    if (m.replyTo) {
                      scrollToMessage(m.replyTo.id, {
                        align: "center",
                        behavior: "smooth",
                      });
                    }
                  }}
                  className="-mb-2 flex max-w-72 items-baseline gap-1.5 rounded-xl border-primary/50 border-l-2 bg-secondary/60 px-2.5 pt-1.5 pb-3.5 text-left text-xs transition-colors hover:bg-secondary"
                >
                  <span className="shrink-0 font-medium">
                    {m.replyTo.authorName}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {m.replyTo.body ?? "📎 Vedlegg"}
                  </span>
                </button>
              )}
              {m.body && (
                <div
                  className={cn(
                    "group/msg relative flex items-center gap-1",
                    isMe ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Bubble
                    variant={isMe ? "default" : "muted"}
                    align={isMe ? "end" : "start"}
                  >
                    <BubbleContent>
                      {renderBody(m.body, memberNames, { onPrimary: isMe })}
                    </BubbleContent>
                  </Bubble>
                  {/* Hover-verktøy: reaksjon + meny. */}
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/msg:opacity-100">
                    <ReactionPicker onPick={(emoji) => onReact(m.id, emoji)} />
                    <MessageActions
                      isMe={isMe}
                      onReply={() => onReply(m)}
                      onEdit={() => {
                        setEditText(m.body ?? "");
                        setEditing(true);
                      }}
                      onDelete={() => onDelete(m.id)}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {m.attachments.map((a) => {
          const isImage = a.mimeType.startsWith("image/");
          return isImage ? (
            // Bilder: stor, klikkbar forhåndsvisning (ikke en kjedelig fil-brikke).
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "block max-w-xs overflow-hidden rounded-2xl border bg-muted ring-1 ring-border transition-transform hover:scale-[1.01]",
                isMe ? "self-end" : "self-start"
              )}
            >
              <img
                src={a.url}
                alt={a.fileName}
                loading="lazy"
                className="h-auto max-h-72 w-full object-cover"
              />
            </a>
          ) : (
            <Attachment
              key={a.id}
              size="default"
              className={cn("max-w-xs", isMe ? "self-end" : "self-start")}
            >
              <AttachmentMedia
                variant="icon"
                className="bg-primary/10 text-primary"
              >
                <Icon name="file-text" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{a.fileName}</AttachmentTitle>
                <AttachmentDescription>
                  {formatSize(a.sizeBytes)}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentTrigger asChild>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={a.fileName}
                >
                  <span className="sr-only">{a.fileName}</span>
                </a>
              </AttachmentTrigger>
            </Attachment>
          );
        })}

        {/* Reaksjoner — tett inntil egen boble (2px) og med ekstra luft ned mot
            neste melding, så det aldri er tvil om hvilken de hører til. Ingen
            overlapp — det blødde inn i meldingen under. */}
        {m.reactions.length > 0 && (
          <div
            className={cn(
              "-mt-2 mb-0.5 flex flex-wrap gap-1",
              isMe ? "justify-end pr-2" : "justify-start pl-2"
            )}
          >
            {m.reactions.map((r) => (
              <ReactionChip
                key={r.emoji}
                emoji={r.emoji}
                count={r.count}
                mine={r.mine}
                onClick={() => onReact(m.id, r.emoji)}
              />
            ))}
          </div>
        )}

        {m.editedAt && !editing && (
          <MessageFooter>
            Redigert kl. {timeFmt.format(new Date(m.editedAt))}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}

/**
 * Hover-meny på en melding: svar (alle), rediger/slett (egne).
 */
function MessageActions({
  isMe,
  onReply,
  onEdit,
  onDelete,
}: {
  isMe: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Meldingshandlinger"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Icon name="more-horizontal" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40">
        <DropdownMenuItem onSelect={onReply}>
          <Icon name="message-square" className="size-4" />
          Svar
        </DropdownMenuItem>
        {isMe && (
          <>
            <DropdownMenuItem onSelect={onEdit}>
              <Icon name="pencil" className="size-4" />
              Rediger
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-destructive">
              <Icon name="trash" className="size-4" />
              Slett
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Liten «legg til reaksjon»-knapp som vises på hover, med et fast emoji-sett.
 */
function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Legg til reaksjon"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <span className="text-base leading-none">😊</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="flex gap-0.5 p-1">
        {reactionEmojis.map((emoji) => (
          <DropdownMenuItem
            key={emoji}
            onSelect={() => onPick(emoji)}
            className="cursor-pointer rounded-md p-1.5 text-base"
          >
            {emoji}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
