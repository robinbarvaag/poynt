"use client";

import { trpc } from "@/lib/planner/trpc";
import { reactionEmojis } from "@poynt/planner-validators";
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
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Skeleton,
  cn,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Composer } from "./composer";
import {
  ReactionChip,
  avatarColor,
  formatSize,
  initials,
  relativeTime,
  renderBody,
} from "./helpers";

type CurrentUser = { id: string; name: string; image: string | null };
type Post = Awaited<
  ReturnType<typeof trpc.chat.listPosts.query>
>["posts"][number];
type Comment = Awaited<ReturnType<typeof trpc.chat.getComments.query>>[number];

/**
 * «Innlegg» — fellesskapets vegg (Facebook-gruppe-stil): del noe øverst,
 * innlegg som kort med reaksjoner og kommentarer under.
 */
export function FeedView({
  currentUser,
  memberNames,
}: {
  currentUser: CurrentUser;
  memberNames: string[];
}) {
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: ["chat", "feed"],
    queryFn: () => trpc.chat.getFeed.query(),
  });
  const feedId = feedQuery.data?.id;

  const postsQuery = useQuery({
    queryKey: ["chat", "posts"],
    queryFn: () => trpc.chat.listPosts.query(undefined),
    refetchInterval: 20_000,
  });
  const posts = postsQuery.data?.posts ?? [];

  const invalidatePosts = () =>
    queryClient.invalidateQueries({ queryKey: ["chat", "posts"] });

  const reactionMutation = useMutation({
    mutationFn: (input: { messageId: string; emoji: string }) =>
      trpc.chat.toggleReaction.mutate(input),
    onSuccess: invalidatePosts,
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      trpc.chat.deleteMessage.mutate({ messageId }),
    onSuccess: invalidatePosts,
    onError: () => toast.error("Kunne ikke slette innlegget."),
  });

  return (
    <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 md:p-6">
        {/* Nytt innlegg */}
        <Card className="overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4">
            <Avatar className="size-9">
              {currentUser.image && <AvatarImage src={currentUser.image} />}
              <AvatarFallback
                className={cn("font-semibold", avatarColor(currentUser.id))}
              >
                {initials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-sm">
              Del noe med fellesskapet, {currentUser.name.split(" ")[0]} 👋
            </p>
          </div>
          <Composer
            frameless
            placeholder="Hva vil du dele i dag?"
            disabled={!feedId}
            onSend={async ({ body, attachments, mentionUserIds }) => {
              if (!feedId) return;
              await trpc.chat.sendMessage.mutate({
                conversationId: feedId,
                body: body || undefined,
                attachments: attachments.length ? attachments : undefined,
                mentionUserIds: mentionUserIds.length
                  ? mentionUserIds
                  : undefined,
              });
              invalidatePosts();
            }}
          />
        </Card>

        {/* Innleggene */}
        {postsQuery.isLoading ? (
          <div className="flex flex-col gap-4">
            {[0, 1].map((i) => (
              <Card key={i} className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <Icon name="megaphone" className="size-8 opacity-40" />
            <p className="font-medium text-foreground">Ingen innlegg ennå</p>
            <p className="text-sm">Bli den første som deler noe! 🎉</p>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              memberNames={memberNames}
              onReact={(emoji) =>
                reactionMutation.mutate({ messageId: post.id, emoji })
              }
              onDelete={() => deleteMutation.mutate(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function PostCard({
  post,
  currentUser,
  memberNames,
  onReact,
  onDelete,
}: {
  post: Post;
  currentUser: CurrentUser;
  memberNames: string[];
  onReact: (emoji: string) => void;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const isMine = post.author.id === currentUser.id;
  const images = post.attachments.filter((a) =>
    a.mimeType.startsWith("image/")
  );
  const files = post.attachments.filter(
    (a) => !a.mimeType.startsWith("image/")
  );

  const commentsQuery = useQuery({
    queryKey: ["chat", "comments", post.id],
    queryFn: () => trpc.chat.getComments.query({ postId: post.id }),
    enabled: commentsOpen,
  });
  const comments = commentsQuery.data ?? [];

  return (
    <Card className="flex flex-col gap-3 p-4">
      {/* Topp: forfatter + tid + meny */}
      <div className="flex items-start gap-3">
        <Avatar className="size-10">
          {post.author.image && <AvatarImage src={post.author.image} />}
          <AvatarFallback
            className={cn("font-semibold", avatarColor(post.author.id))}
          >
            {initials(post.author.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-semibold text-sm">{post.author.name}</span>
          <span className="text-muted-foreground text-xs">
            {relativeTime(post.createdAt)}
            {post.editedAt ? " · redigert" : ""}
          </span>
        </div>
        {isMine && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Innleggs-handlinger"
              >
                <Icon name="more-horizontal" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onSelect={onDelete}
                className="text-destructive"
              >
                <Icon name="trash" className="size-4" />
                Slett innlegg
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Innhold */}
      {post.body && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {renderBody(post.body, memberNames)}
        </p>
      )}

      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-1.5 overflow-hidden rounded-xl",
            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}
        >
          {images.map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden bg-muted"
            >
              <img
                src={a.url}
                alt={a.fileName}
                loading="lazy"
                className={cn(
                  "w-full object-cover transition-transform hover:scale-[1.02]",
                  images.length === 1 ? "max-h-96" : "aspect-square"
                )}
              />
            </a>
          ))}
        </div>
      )}

      {files.map((a) => (
        <Attachment key={a.id} size="default" className="max-w-xs">
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
      ))}

      {/* Reaksjoner + kommentar-knapp */}
      <div className="flex flex-wrap items-center gap-1.5 border-t pt-2.5">
        {post.reactions.map((r) => (
          <ReactionChip
            key={r.emoji}
            emoji={r.emoji}
            count={r.count}
            mine={r.mine}
            onClick={() => onReact(r.emoji)}
          />
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Reager på innlegget"
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <span className="text-base leading-none">😊</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="flex gap-0.5 p-1">
            {reactionEmojis.map((emoji) => (
              <DropdownMenuItem
                key={emoji}
                onSelect={() => onReact(emoji)}
                className="cursor-pointer rounded-md p-1.5 text-base"
              >
                {emoji}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
        >
          <Icon name="message-square" className="size-3.5" />
          {post.commentCount === 0
            ? "Kommenter"
            : `${post.commentCount} kommentar${post.commentCount === 1 ? "" : "er"}`}
        </button>
      </div>

      {/* Kommentarer */}
      {commentsOpen && (
        <div className="flex flex-col gap-2.5">
          {commentsQuery.isLoading ? (
            <div className="flex items-center gap-2 px-1">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-8 flex-1 rounded-xl" />
            </div>
          ) : (
            comments.map((c) => (
              <CommentRow key={c.id} comment={c} memberNames={memberNames} />
            ))
          )}
          <CommentInput
            postId={post.id}
            currentUser={currentUser}
            onPosted={() => {
              queryClient.invalidateQueries({
                queryKey: ["chat", "comments", post.id],
              });
              queryClient.invalidateQueries({ queryKey: ["chat", "posts"] });
            }}
          />
        </div>
      )}
    </Card>
  );
}

function CommentRow({
  comment: c,
  memberNames,
}: {
  comment: Comment;
  memberNames: string[];
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Avatar className="mt-0.5 size-7">
        {c.author.image && <AvatarImage src={c.author.image} />}
        <AvatarFallback
          className={cn("font-semibold text-[10px]", avatarColor(c.author.id))}
        >
          {initials(c.author.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="w-fit max-w-full rounded-2xl bg-muted px-3 py-1.5">
          <span className="font-semibold text-xs">{c.author.name}</span>
          {c.body && (
            <p className="whitespace-pre-wrap text-sm leading-snug">
              {renderBody(c.body, memberNames)}
            </p>
          )}
        </div>
        <span className="px-2 text-[11px] text-muted-foreground">
          {relativeTime(c.createdAt)}
        </span>
      </div>
    </div>
  );
}

function CommentInput({
  postId,
  currentUser,
  onPosted,
}: {
  postId: string;
  currentUser: CurrentUser;
  onPosted: () => void;
}) {
  const feedQuery = useQuery({
    queryKey: ["chat", "feed"],
    queryFn: () => trpc.chat.getFeed.query(),
  });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const body = text.trim();
    const feedId = feedQuery.data?.id;
    if (!body || !feedId || sending) return;
    setSending(true);
    try {
      await trpc.chat.sendMessage.mutate({
        conversationId: feedId,
        body,
        parentMessageId: postId,
      });
      setText("");
      onPosted();
    } catch {
      toast.error("Kunne ikke legge til kommentaren.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="size-7">
        {currentUser.image && <AvatarImage src={currentUser.image} />}
        <AvatarFallback
          className={cn(
            "font-semibold text-[10px]",
            avatarColor(currentUser.id)
          )}
        >
          {initials(currentUser.name)}
        </AvatarFallback>
      </Avatar>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Skriv en kommentar …"
        disabled={sending}
        className="h-9 rounded-full"
      />
      <Button
        type="button"
        size="icon-sm"
        className="shrink-0 rounded-full"
        aria-label="Send kommentar"
        disabled={!text.trim() || sending}
        onClick={submit}
      >
        {sending ? (
          <Icon name="loader" className="size-4 animate-spin" />
        ) : (
          <Icon name="send" className="size-4" />
        )}
      </Button>
    </div>
  );
}
