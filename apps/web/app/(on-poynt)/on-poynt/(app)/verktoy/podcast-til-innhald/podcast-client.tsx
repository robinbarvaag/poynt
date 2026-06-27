"use client";

import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import { trpc } from "@/lib/planner/trpc";
import type { PodcastToContentResponse } from "@poynt/planner-validators";
import { Button, Icon, PageHeader, PageShell, toast } from "@poynt/ui";
import type { IconName } from "@poynt/ui/icons";
import { useRef, useState } from "react";

const PODCAST_STEPS: ToolIntroStep[] = [
  {
    icon: "file-text",
    title: "Blogginnlegg",
    description: "Fullstendig artikkel med overskrifter og avsnitt.",
  },
  {
    icon: "share",
    title: "Sosiale medier-postar",
    description: "Klare utkast til LinkedIn, Instagram og X/Twitter.",
  },
  {
    icon: "clock",
    title: "Kapittelmerke",
    description: "Tidsstempel med emnenamn for YouTube og Spotify.",
  },
];

interface SavedPodcastResult {
  id: string;
  transcript?: string;
  blogPost?: { title: string; content: string };
  socialPosts?: { linkedin: string; instagram: string; twitter: string };
  chapters?: Array<{ timestamp: string; title: string }>;
  createdAt: Date;
}

interface PodcastClientProps {
  initialSavedResult: SavedPodcastResult | null;
}

type Step = "upload" | "transcribing" | "review" | "generating" | "result";

export function PodcastClient({ initialSavedResult }: PodcastClientProps) {
  const [step, setStep] = useState<Step>(
    initialSavedResult ? "result" : "upload"
  );
  const [transcript, setTranscript] = useState(
    initialSavedResult?.transcript ?? ""
  );
  const [generateBlogPost, setGenerateBlogPost] = useState(true);
  const [generateSocialPosts, setGenerateSocialPosts] = useState(true);
  const [generateChapters, setGenerateChapters] = useState(true);
  const [result, setResult] = useState<PodcastToContentResponse | null>(
    initialSavedResult
      ? {
          success: true,
          blogPost: initialSavedResult.blogPost,
          socialPosts: initialSavedResult.socialPosts,
          chapters: initialSavedResult.chapters,
        }
      : null
  );
  const [savedResultId, setSavedResultId] = useState<string | null>(
    initialSavedResult?.id ?? null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setStep("transcribing");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch("/on-poynt/api/podcast/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toast.error(data.error ?? "Transkripsjon feila");
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
        generateBlogPost,
        generateSocialPosts,
        generateChapters,
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
          title: response.blogPost?.title ?? "Podcast-innhald",
          inputs: { transcript } as Record<string, unknown>,
          result: {
            transcript,
            blogPost: response.blogPost,
            socialPosts: response.socialPosts,
            chapters: response.chapters,
          },
        });
        if (saved) setSavedResultId(saved.id);
      } catch {
        // Save error is non-critical
      }
    } catch {
      toast.error("Noko gjekk gale. Prøv igjen.");
      setStep("review");
    }
  }

  function handleCopy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} kopiert`);
    });
  }

  return (
    <PageShell>
      {/* Step 1: Upload — full intro i verktøy-familiens uttrykk */}
      {step === "upload" && (
        <ToolIntro
          icon="mic"
          title="Podcast til innhald"
          description="Last opp ein podkast-episode, så gjer vi om praten til ferdig innhald — blogginnlegg, sosiale medier-postar og kapittelmerke."
          steps={PODCAST_STEPS}
        >
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
                <Icon name="mic" className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Dra og slepp lydfila her</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Støttar MP3, M4A, WAV, OGG, FLAC — maks 25 MB
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                <Icon name="plus" className="h-4 w-4" />
                Vel fil
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
        </ToolIntro>
      )}

      {step !== "upload" && (
        <PageHeader
          title="Podcast til innhald"
          description="Last opp ein podkast-episode og generer blogginnlegg, sosiale medier-postar og kapittelmerke automatisk."
        />
      )}

      {/* Step 2: Transcribing */}
      {step === "transcribing" && (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/50 p-10 text-center">
          <Icon name="loader" className="h-8 w-8 animate-spin text-primary" />
          <div>
            <p className="font-medium">Transkriberer lydfila...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dette kan ta eit par minutt avhengig av lengda på episoden.
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review transcript + choose outputs */}
      {step === "review" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="transcript">
              Transkripsjon
            </label>
            <p className="text-xs text-muted-foreground">
              Rediger transkripsjonens om naudsynt før du genererer innhald.
            </p>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Kva vil du generera?</p>
            <div className="space-y-2">
              {[
                {
                  id: "blog",
                  label: "Blogginnlegg",
                  desc: "Fullstendig artikkel med overskrifter og avsnitt",
                  checked: generateBlogPost,
                  onChange: setGenerateBlogPost,
                },
                {
                  id: "social",
                  label: "Sosiale medier-postar",
                  desc: "LinkedIn, Instagram og X/Twitter",
                  checked: generateSocialPosts,
                  onChange: setGenerateSocialPosts,
                },
                {
                  id: "chapters",
                  label: "Kapittelmerke",
                  desc: "Tidsstempel med emnenamn for YouTube/Spotify",
                  checked: generateChapters,
                  onChange: setGenerateChapters,
                },
              ].map(({ id, label, desc, checked, onChange }) => (
                <label
                  key={id}
                  htmlFor={id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50"
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={
                !transcript.trim() ||
                (!generateBlogPost && !generateSocialPosts && !generateChapters)
              }
            >
              <Icon name="sparkles" className="h-4 w-4" />
              Generer innhald
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTranscript("");
                setStep("upload");
              }}
            >
              Last opp ny fil
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
            <p className="font-medium">Genererer innhald...</p>
            <p className="mt-1 text-sm text-muted-foreground">
              AI skriv blogginnlegg, postar og kapittelmerke frå
              transkripsjonens.
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
              Innhald lagra
            </div>
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
                    key: "linkedin",
                    text: result.socialPosts.linkedin,
                  },
                  {
                    label: "Instagram",
                    key: "instagram",
                    text: result.socialPosts.instagram,
                  },
                  {
                    label: "X / Twitter",
                    key: "twitter",
                    text: result.socialPosts.twitter,
                  },
                ].map(({ label, text }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {label}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopy(text, label)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Icon name="copy" className="h-3 w-3" />
                        Kopier
                      </button>
                    </div>
                    <p className="rounded-md bg-muted/50 p-3 text-sm whitespace-pre-wrap">
                      {text}
                    </p>
                  </div>
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

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTranscript("");
              setResult(null);
              setSavedResultId(null);
              setStep("upload");
            }}
          >
            <Icon name="mic" className="h-4 w-4" />
            Ny episode
          </Button>
        </div>
      )}
    </PageShell>
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
