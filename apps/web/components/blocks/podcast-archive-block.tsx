import config from "@/payload.config";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPayload } from "payload";
import { PodcastCard } from "../podcast-card";

interface PodcastArchiveBlockProps {
  title?: string;
  description?: string;
  limit?: number;
  showMoreLink?: boolean;
}

export async function PodcastArchiveBlock({
  title,
  description,
  limit = 6,
  showMoreLink = true,
}: PodcastArchiveBlockProps) {
  const payload = await getPayload({ config });

  const podcasts = await payload.find({
    collection: "podcasts",
    limit: limit || 100,
    sort: "-publishedAt",
  });

  if (!podcasts.docs.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="mb-8 md:mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{title}</h2>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.docs.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast as any} />
          ))}
        </div>

        {showMoreLink && podcasts.totalDocs > (limit || 0) && (
          <div className="mt-8 text-center">
            <Link
              href="/podcast"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Se alle episoder
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
