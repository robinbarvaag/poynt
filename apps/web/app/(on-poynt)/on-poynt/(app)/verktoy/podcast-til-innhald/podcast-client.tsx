"use client";

import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import { trpc } from "@/lib/planner/trpc";
import type { PodcastToContentResponse } from "@poynt/planner-validators";
import {
  Button,
  Checkbox,
  Icon,
  Input,
  Label,
  PageHeader,
  PageShell,
  Textarea,
  toast,
} from "@poynt/ui";
import type { IconName } from "@poynt/ui/icons";
import { useRef, useState } from "react";

const PODCAST_STEPS: ToolIntroStep[] = [
  {
    icon: "file-text",
    title: "Blogg & nyhetsbrev",
    description: "Fullstendig artikkel og ferdig nyhetsbrev fra episoden.",
  },
  {
    icon: "share",
    title: "Sosialt, klipp & carousels",
    description: "Poster, klipp-plan med hooks og karuseller – klare til bruk.",
  },
  {
    icon: "clock",
    title: "Kapittel & sitater",
    description: "Tidsstempel for YouTube/Spotify og delbare sitater.",
  },
];

interface PodcastEpisode {
  title: string;
  date?: string;
  duration?: string;
  audioUrl: string;
}

interface SavedPodcastResult {
  id: string;
  title?: string;
  transcript?: string;
  keyPoints?: string[];
  blogPost?: { title: string; content: string };
  socialPosts?: { linkedin: string; instagram: string; twitter: string };
  chapters?: Array<{ timestamp: string; title: string }>;
  clipPlan?: Array<{
    timestamp: string;
    title: string;
    hook: string;
    reason?: string;
  }>;
  carousels?: Array<{ title: string; slides: string[] }>;
  newsletter?: { subject: string; body: string };
  quotes?: string[];
  createdAt: Date;
}

interface PodcastClientProps {
  savedResults: SavedPodcastResult[];
  initialFeedUrl?: string;
}

type Step = "upload" | "transcribing" | "review" | "generating" | "result";
type InputMode = "upload" | "url";

function resultFromSaved(saved: SavedPodcastResult): PodcastToContentResponse {
  return {
    success: true,
    keyPoints: saved.keyPoints,
    blogPost: saved.blogPost,
    socialPosts: saved.socialPosts,
    chapters: saved.chapters,
    clipPlan: saved.clipPlan,
    carousels: saved.carousels,
    newsletter: saved.newsletter,
    quotes: saved.quotes,
  };
}

export function PodcastClient({
  savedResults,
  initialFeedUrl,
}: PodcastClientProps) {
  const [step, setStep] = useState<Step>("upload");
  const [inputMode, setInputMode] = useState<InputMode>(
    initialFeedUrl ? "url" : "upload"
  );
  const [url, setUrl] = useState(initialFeedUrl ?? "");
  const [episodes, setEpisodes] = useState<PodcastEpisode[] | null>(null);
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [generateKeyPoints, setGenerateKeyPoints] = useState(true);
  const [generateBlogPost, setGenerateBlogPost] = useState(true);
  const [generateSocialPosts, setGenerateSocialPosts] = useState(true);
  const [generateChapters, setGenerateChapters] = useState(true);
  const [generateClipPlan, setGenerateClipPlan] = useState(true);
  const [generateCarousels, setGenerateCarousels] = useState(true);
  const [generateNewsletter, setGenerateNewsletter] = useState(true);
  const [generateQuotes, setGenerateQuotes] = useState(true);
  const [result, setResult] = useState<PodcastToContentResponse | null>(null);
  const [savedResultId, setSavedResultId] = useState<string | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string | null>(null);
  const [savedList, setSavedList] = useState(savedResults);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openSaved(saved: SavedPodcastResult) {
    setResult(resultFromSaved(saved));
    setTranscript(saved.transcript ?? "");
    setSavedResultId(saved.id);
    setStep("result");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await trpc.toolResult.delete.mutate({ id });
      setSavedList((list) => list.filter((s) => s.id !== id));
      toast.success("Episode slettet");
    } catch {
      toast.error("Kunne ikke slette. Prøv igjen.");
    } finally {
      setDeletingId(null);
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setStep("transcribing");
    setEpisodeTitle(file.name.replace(/\.[^.]+$/, ""));

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch("/on-poynt/api/podcast/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? "Transkripsjon feilet");
        setStep("upload");
        return;
      }

      const data = (await response.json()) as { transcript: string };
      setTranscript(data.transcript);
      setStep("review");
    } catch {
      toast.error("Nettverksfeil. Prøv igjen.");
      setStep("upload");
    }
  }

  async function handleFetchFeed() {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error("Lim inn en gyldig lenke (http/https).");
      return;
    }

    setIsFetchingFeed(true);
    setEpisodes(null);

    try {
      const response = await fetch("/on-poynt/api/podcast/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await response.json()) as {
        episodes?: PodcastEpisode[];
        error?: string;
      };

      if (!response.ok || !data.episodes) {
        toast.error(data.error ?? "Kunne ikke lese feeden");
        return;
      }

      // Husk feeden på bedriften (ikke direkte lydfiler), så den forhåndsfylles
      // neste gang. Fire-and-forget — feilfri lagring er ikke kritisk her.
      const isFeedUrl = !/\.(mp3|m4a|wav|ogg|flac|aac)(\?|$)/i.test(trimmed);
      if (isFeedUrl && trimmed !== initialFeedUrl) {
        trpc.workspaceProfile.upsert
          .mutate({ podcastFeedUrl: trimmed })
          .catch(() => {});
      }

      // Direkte lydfil → bare én episode → transkriber med en gang.
      const only = data.episodes.length === 1 ? data.episodes[0] : undefined;
      if (only) {
        handleTranscribeUrl(only.audioUrl, only.title);
        return;
      }

      setEpisodes(data.episodes);
    } catch {
      toast.error("Nettverksfeil. Prøv igjen.");
    } finally {
      setIsFetchingFeed(false);
    }
  }

  async function handleTranscribeUrl(audioUrl: string, title?: string) {
    setStep("transcribing");
    if (title) setEpisodeTitle(title);

    try {
      const response = await fetch("/on-poynt/api/podcast/transcribe-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: audioUrl }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? "Transkripsjon feilet");
        setStep("upload");
        return;
      }

      const data = (await response.json()) as { transcript: string };
      setTranscript(data.transcript);
      setStep("review");
    } catch {
      toast.error("Nettverksfeil. Prøv igjen.");
      setStep("upload");
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  async function handleGenerate() {
    if (!transcript.trim()) {
      toast.error("Transkripsjon er tom");
      return;
    }

    setStep("generating");

    try {
      const response = await trpc.ai.podcastToContent.mutate({
        transcript,
        generateKeyPoints,
        generateBlogPost,
        generateSocialPosts,
        generateChapters,
        generateClipPlan,
        generateCarousels,
        generateNewsletter,
        generateQuotes,
      });

      if (!response.success || response.error) {
        toast.error(response.error ?? "Generering feila");
        setStep("review");
        return;
      }

      setResult(response);
      setStep("result");

      // Save to database
      try {
        const saved = await trpc.toolResult.save.mutate({
          toolId: "podcast-to-content",
          title: episodeTitle ?? response.blogPost?.title ?? "Podcast-innhold",
          inputs: { transcript } as Record<string, unknown>,
          result: {
            transcript,
            keyPoints: response.keyPoints,
            blogPost: response.blogPost,
            socialPosts: response.socialPosts,
            chapters: response.chapters,
            clipPlan: response.clipPlan,
            carousels: response.carousels,
            newsletter: response.newsletter,
            quotes: response.quotes,
          },
        });
        if (saved) setSavedResultId(saved.id);
      } catch {
        // Save error is non-critical
      }
    } catch {
      toast.error("Noe gikk galt. Prøv igjen.");
      setStep("review");
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} kopiert`);
    });
  }

  function resetToUpload() {
    setTranscript("");
    setUrl(initialFeedUrl ?? "");
    setEpisodes(null);
    setResult(null);
    setSavedResultId(null);
    setEpisodeTitle(null);
    setStep("upload");
  }

  return (
    <PageShell>
      {/* Step 1: Upload — full intro i verktøy-familiens uttrykk */}
      {step === "upload" && (
        <ToolIntro
          icon="mic"
          title="Podcast til innhold"
          description="Lim inn en lenke til en podkast-episode eller last opp lydfilen, så gjør vi om praten til ferdig innhold – blogg, nyhetsbrev, sosiale poster, klipp-plan, carousels, kapittelmerker og sitater."
          steps={PODCAST_STEPS}
        >
          <div className="space-y-4">
            {/* Veksling: lenke vs filopplasting */}
            <div className="inline-flex rounded-lg border bg-muted/50 p-1">
              {[
                {
                  id: "upload" as const,
                  label: "Last opp fil",
                  icon: "upload",
                },
                {
                  id: "url" as const,
                  label: "Lim inn lenke",
                  icon: "external-link",
                },
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setInputMode(id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    inputMode === id
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name={icon as IconName} className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {inputMode === "url" ? (
              <div className="space-y-4 rounded-xl border bg-card p-6">
                <div className="space-y-1">
                  <Label htmlFor="podcast-url">
                    RSS-feed eller lenke til episode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Lim inn RSS-feeden, så henter vi episodene du kan velge
                    mellom. Direkte lyd-URL (.mp3) fungerer også.
                    Spotify/Apple-sider gir dessverre ikke tilgang til selve
                    lyden.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="podcast-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && url.trim() && !isFetchingFeed)
                        handleFetchFeed();
                    }}
                    placeholder="https://anchor.fm/s/…/podcast/rss"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleFetchFeed}
                    disabled={!url.trim() || isFetchingFeed}
                  >
                    <Icon
                      name={isFetchingFeed ? "loader" : "search"}
                      className={`h-4 w-4 ${isFetchingFeed ? "animate-spin" : ""}`}
                    />
                    Hent episoder
                  </Button>
                </div>

                {episodes && episodes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {episodes.length} episoder — velg én å gjøre om til
                      innhold:
                    </p>
                    <ul className="max-h-80 space-y-1 overflow-y-auto">
                      {episodes.map((ep) => (
                        <li key={ep.audioUrl}>
                          <button
                            type="button"
                            onClick={() =>
                              handleTranscribeUrl(ep.audioUrl, ep.title)
                            }
                            className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
                          >
                            <Icon
                              name="play"
                              className="h-4 w-4 shrink-0 text-muted-foreground"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {ep.title}
                              </p>
                              {(ep.date || ep.duration) && (
                                <p className="text-xs text-muted-foreground">
                                  {[ep.date, ep.duration]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className={`w-full rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-full bg-muted p-4">
                    <Icon
                      name="mic"
                      className="h-8 w-8 text-muted-foreground"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Dra og slipp lydfilen her</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Støtter MP3, M4A, WAV, OGG, FLAC — maks 25 MB
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                    <Icon name="plus" className="h-4 w-4" />
                    Velg fil
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/flac,audio/x-m4a,audio/webm"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </button>
            )}

            {savedList.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Tidligere episoder</p>
                <ul className="space-y-1">
                  {savedList.map((saved) => (
                    <li
                      key={saved.id}
                      className="flex items-center gap-1 rounded-lg border bg-background transition-colors hover:border-primary/50"
                    >
                      <button
                        type="button"
                        onClick={() => openSaved(saved)}
                        className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left"
                      >
                        <Icon
                          name="file-text"
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {saved.title ?? "Podcast-innhold"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {saved.createdAt.toLocaleDateString("nb-NO", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(saved.id)}
                        disabled={deletingId === saved.id}
                        aria-label="Slett episode"
                        className="mr-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
                      >
                        <Icon
                          name={deletingId === saved.id ? "loader" : "trash"}
                          className={`h-4 w-4 ${deletingId === saved.id ? "animate-spin" : ""}`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ToolIntro>
      )}

      {step !== "upload" && (
        <PageHeader
          title="Podcast til innhold"
          description="Gjør én episode om til mange ferdige innholdsbiter automatisk."
        />
      )}

      {/* Step 2: Transcribing */}
      {step === "transcribing" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/50 p-10 text-center">
          <Icon name="loader" className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="font-medium">Transkriberer episoden...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dette kan ta et par minutter avhengig av lengden på episoden.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review transcript + choose outputs */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transcript">Transkripsjon</Label>
            <p className="text-xs text-muted-foreground">
              Rediger transkripsjonen om nødvendig før du genererer innhold.
            </p>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Hva vil du generere?</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  id: "keypoints",
                  label: "Nøkkelpunkter",
                  desc: "3–6 kulepunkter med kjernen i episoden",
                  checked: generateKeyPoints,
                  onChange: setGenerateKeyPoints,
                },
                {
                  id: "blog",
                  label: "Blogginnlegg",
                  desc: "Fullstendig artikkel med overskrifter",
                  checked: generateBlogPost,
                  onChange: setGenerateBlogPost,
                },
                {
                  id: "social",
                  label: "Sosiale medier-poster",
                  desc: "LinkedIn, Instagram og X/Twitter",
                  checked: generateSocialPosts,
                  onChange: setGenerateSocialPosts,
                },
                {
                  id: "clipplan",
                  label: "Klipp-plan",
                  desc: "Delbare øyeblikk med ferdig hook",
                  checked: generateClipPlan,
                  onChange: setGenerateClipPlan,
                },
                {
                  id: "carousels",
                  label: "Carousels",
                  desc: "Karuseller med flere slides",
                  checked: generateCarousels,
                  onChange: setGenerateCarousels,
                },
                {
                  id: "newsletter",
                  label: "Nyhetsbrev",
                  desc: "Emnelinje + ferdig e-posttekst",
                  checked: generateNewsletter,
                  onChange: setGenerateNewsletter,
                },
                {
                  id: "quotes",
                  label: "Sitater",
                  desc: "Delbare sitater til grafikk",
                  checked: generateQuotes,
                  onChange: setGenerateQuotes,
                },
                {
                  id: "chapters",
                  label: "Kapittelmerke",
                  desc: "Tidsstempel for YouTube/Spotify",
                  checked: generateChapters,
                  onChange: setGenerateChapters,
                },
              ].map(({ id, label, desc, checked, onChange }) => (
                <Label
                  key={id}
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 font-normal hover:bg-muted/50"
                >
                  <Checkbox
                    id={id}
                    size="sm"
                    checked={checked}
                    onCheckedChange={(value) => onChange(value === true)}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs font-normal text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                </Label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={
                !transcript.trim() ||
                !(
                  generateKeyPoints ||
                  generateBlogPost ||
                  generateSocialPosts ||
                  generateChapters ||
                  generateClipPlan ||
                  generateCarousels ||
                  generateNewsletter ||
                  generateQuotes
                )
              }
            >
              Generer innhold
            </Button>
            <Button type="button" variant="outline" onClick={resetToUpload}>
              Ny episode
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === "generating" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/50 p-10 text-center">
          <Icon
            name="sparkles"
            className="h-8 w-8 animate-pulse text-primary"
          />
          <div>
            <p className="font-medium">Genererer innhold...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              AI gjør transkripsjonen om til ferdige innholdsbiter.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Result */}
      {step === "result" && result && (
        <div className="space-y-6">
          {savedResultId && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="check-circle" className="h-4 w-4 text-primary" />
              Innhold lagret
            </div>
          )}

          {result.keyPoints && result.keyPoints.length > 0 && (
            <ResultSection
              title="Nøkkelpunkter"
              icon="lightbulb"
              onCopy={() => {
                const points = result.keyPoints ?? [];
                handleCopy(
                  points.map((p) => `• ${p}`).join("\n"),
                  "Nøkkelpunkter"
                );
              }}
            >
              <ul className="space-y-1.5">
                {result.keyPoints.map((point) => (
                  <li key={point} className="flex gap-2 text-sm">
                    <span className="text-primary">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </ResultSection>
          )}

          {result.blogPost && (
            <ResultSection
              title="Blogginnlegg"
              icon="file-text"
              onCopy={() => {
                const { title, content } = result.blogPost ?? {};
                if (title && content)
                  handleCopy(`# ${title}\n\n${content}`, "Blogginnlegg");
              }}
            >
              <div className="space-y-2">
                <h3 className="font-semibold">{result.blogPost.title}</h3>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {result.blogPost.content}
                </div>
              </div>
            </ResultSection>
          )}

          {result.newsletter && (
            <ResultSection
              title="Nyhetsbrev"
              icon="mail"
              onCopy={() => {
                const { subject, body } = result.newsletter ?? {};
                if (subject && body)
                  handleCopy(`Emne: ${subject}\n\n${body}`, "Nyhetsbrev");
              }}
            >
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Emnelinje
                </p>
                <h3 className="font-semibold">{result.newsletter.subject}</h3>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {result.newsletter.body}
                </div>
              </div>
            </ResultSection>
          )}

          {result.socialPosts && (
            <ResultSection
              title="Sosiale medier"
              icon="share"
              onCopy={undefined}
            >
              <div className="space-y-4">
                {[
                  {
                    label: "LinkedIn",
                    text: result.socialPosts.linkedin,
                  },
                  {
                    label: "Instagram",
                    text: result.socialPosts.instagram,
                  },
                  {
                    label: "X / Twitter",
                    text: result.socialPosts.twitter,
                  },
                ].map(({ label, text }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                      <CopyButton onClick={() => handleCopy(text, label)} />
                    </div>
                    <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          {result.clipPlan && result.clipPlan.length > 0 && (
            <ResultSection
              title="Klipp-plan"
              icon="scissors"
              onCopy={() => {
                const clips = result.clipPlan ?? [];
                handleCopy(
                  clips
                    .map(
                      (c) =>
                        `${c.timestamp} — ${c.title}\n${c.hook}${c.reason ? `\nHvorfor: ${c.reason}` : ""}`
                    )
                    .join("\n\n"),
                  "Klipp-plan"
                );
              }}
            >
              <p className="mb-3 text-xs text-muted-foreground">
                Forslag til de mest delbare øyeblikkene i episoden — klipp dem
                ut til reels/shorts og bruk den ferdige hooken som tekst over
                klippet.
              </p>
              <div className="space-y-4">
                {result.clipPlan.map((clip) => (
                  <div
                    key={`${clip.timestamp}-${clip.title}`}
                    className="space-y-1 rounded-md bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {clip.timestamp}
                      </span>
                      <span className="text-sm font-medium">{clip.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {clip.hook}
                    </p>
                    {clip.reason && (
                      <p className="flex gap-1.5 text-xs text-muted-foreground">
                        <Icon
                          name="lightbulb"
                          className="mt-0.5 h-3 w-3 shrink-0 text-primary"
                        />
                        <span>
                          <span className="font-medium">Hvorfor: </span>
                          {clip.reason}
                        </span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          {result.carousels && result.carousels.length > 0 && (
            <ResultSection title="Carousels" icon="layers" onCopy={undefined}>
              <div className="space-y-4">
                {result.carousels.map((carousel) => (
                  <div key={carousel.title} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{carousel.title}</p>
                      <CopyButton
                        onClick={() =>
                          handleCopy(
                            `${carousel.title}\n\n${carousel.slides
                              .map((s, i) => `${i + 1}. ${s}`)
                              .join("\n")}`,
                            "Carousel"
                          )
                        }
                      />
                    </div>
                    <ol className="space-y-2">
                      {carousel.slides.map((slide, i) => (
                        <li
                          key={`${carousel.title}-${i}`}
                          className="flex gap-3 rounded-md bg-muted/50 p-3 text-sm"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            {i + 1}
                          </span>
                          <span className="whitespace-pre-wrap">{slide}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          {result.quotes && result.quotes.length > 0 && (
            <ResultSection
              title="Sitater"
              icon="quote"
              onCopy={() => {
                const quotes = result.quotes ?? [];
                handleCopy(quotes.map((q) => `«${q}»`).join("\n\n"), "Sitater");
              }}
            >
              <div className="space-y-2">
                {result.quotes.map((quote) => (
                  <blockquote
                    key={quote}
                    className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground"
                  >
                    «{quote}»
                  </blockquote>
                ))}
              </div>
            </ResultSection>
          )}

          {result.chapters && result.chapters.length > 0 && (
            <ResultSection
              title="Kapittelmerke"
              icon="clock"
              onCopy={() => {
                const chapters = result.chapters ?? [];
                handleCopy(
                  chapters.map((c) => `${c.timestamp} ${c.title}`).join("\n"),
                  "Kapittelmerke"
                );
              }}
            >
              <div className="space-y-1">
                {result.chapters.map((chapter) => (
                  <div
                    key={`${chapter.timestamp}-${chapter.title}`}
                    className="flex gap-4 text-sm"
                  >
                    <span className="font-mono text-muted-foreground w-14 shrink-0">
                      {chapter.timestamp}
                    </span>
                    <span>{chapter.title}</span>
                  </div>
                ))}
              </div>
            </ResultSection>
          )}

          <Button type="button" variant="outline" onClick={resetToUpload}>
            <Icon name="mic" className="h-4 w-4" />
            Ny episode
          </Button>
        </div>
      )}
    </PageShell>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Icon name="copy" className="h-3 w-3" />
      Kopier
    </button>
  );
}

function ResultSection({
  title,
  icon,
  onCopy,
  children,
}: {
  title: string;
  icon: IconName;
  onCopy: (() => void) | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2 font-medium">
          <Icon name={icon} className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Icon name="copy" className="h-3 w-3" />
            Kopier alt
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
