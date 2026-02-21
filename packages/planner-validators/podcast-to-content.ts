import { z } from "zod";

export const podcastToContentRequestSchema = z.object({
  transcript: z.string().min(1, "Transkripsjon kan ikkje vera tom"),
  generateBlogPost: z.boolean().default(true),
  generateSocialPosts: z.boolean().default(true),
  generateChapters: z.boolean().default(true),
});

export type PodcastToContentRequest = z.infer<
  typeof podcastToContentRequestSchema
>;

export interface PodcastToContentResponse {
  success: boolean;
  error?: string;
  blogPost?: {
    title: string;
    content: string;
  };
  socialPosts?: {
    linkedin: string;
    instagram: string;
    twitter: string;
  };
  chapters?: Array<{
    timestamp: string;
    title: string;
  }>;
}
