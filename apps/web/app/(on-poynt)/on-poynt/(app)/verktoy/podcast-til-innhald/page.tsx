import { TierGate } from "@/components/planner/tier-gate";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { PodcastClient } from "./podcast-client";

interface SavedPodcastResult {
  id: string;
  transcript?: string;
  blogPost?: { title: string; content: string };
  socialPosts?: { linkedin: string; instagram: string; twitter: string };
  chapters?: Array<{ timestamp: string; title: string }>;
  createdAt: Date;
}

export default async function PodcastPage() {
  const trpc = await createServerCaller();

  let initialSavedResult: SavedPodcastResult | null = null;

  try {
    const saved = await trpc.toolResult.list({
      toolId: "podcast-to-content",
      limit: 1,
    });

    const firstResult = saved[0];
    if (firstResult?.result) {
      const resultData = firstResult.result as {
        transcript?: string;
        blogPost?: { title: string; content: string };
        socialPosts?: { linkedin: string; instagram: string; twitter: string };
        chapters?: Array<{ timestamp: string; title: string }>;
      };
      initialSavedResult = {
        id: firstResult.id,
        transcript: resultData.transcript,
        blogPost: resultData.blogPost,
        socialPosts: resultData.socialPosts,
        chapters: resultData.chapters,
        createdAt: new Date(firstResult.createdAt),
      };
    }
  } catch {
    // No saved result
  }

  return (
    <TierGate>
      <PodcastClient initialSavedResult={initialSavedResult} />
    </TierGate>
  );
}
