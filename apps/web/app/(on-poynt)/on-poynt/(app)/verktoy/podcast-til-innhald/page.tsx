import { TierGate } from "@/components/planner/tier-gate";
import { requireFeature } from "@/lib/features/server";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { PodcastClient } from "./podcast-client";

interface SavedPodcastResult {
  id: string;
  title?: string;
  transcript?: string;
  keyPoints?: string[];
  blogPost?: { title: string; content: string };
  socialPosts?: { linkedin: string; instagram: string; twitter: string };
  chapters?: Array<{ timestamp: string; title: string }>;
  clipPlan?: Array<{ timestamp: string; title: string; hook: string }>;
  carousels?: Array<{ title: string; slides: string[] }>;
  newsletter?: { subject: string; body: string };
  quotes?: string[];
  createdAt: Date;
}

type StoredResult = {
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
};

export default async function PodcastPage() {
  await requireFeature("podcastTilInnhold");
  const trpc = await createServerCaller();

  let savedResults: SavedPodcastResult[] = [];

  try {
    const saved = await trpc.toolResult.list({
      toolId: "podcast-to-content",
      limit: 20,
    });

    savedResults = saved
      .filter((row) => row.result)
      .map((row) => {
        const data = row.result as StoredResult;
        return {
          id: row.id,
          title: row.title ?? undefined,
          transcript: data.transcript,
          keyPoints: data.keyPoints,
          blogPost: data.blogPost,
          socialPosts: data.socialPosts,
          chapters: data.chapters,
          clipPlan: data.clipPlan,
          carousels: data.carousels,
          newsletter: data.newsletter,
          quotes: data.quotes,
          createdAt: new Date(row.createdAt),
        };
      });
  } catch {
    // Ingen lagrede resultater
  }

  let initialFeedUrl: string | undefined;
  try {
    const profile = await trpc.workspaceProfile.get();
    initialFeedUrl = profile.podcastFeedUrl ?? undefined;
  } catch {
    // Ingen profil / feed lagret
  }

  return (
    <TierGate>
      <PodcastClient
        savedResults={savedResults}
        initialFeedUrl={initialFeedUrl}
      />
    </TierGate>
  );
}
