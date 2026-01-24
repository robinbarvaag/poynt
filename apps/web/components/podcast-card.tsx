import { getMediaUrl } from "@/lib/media-url";
import { Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Podcast {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: {
    url: string;
    alt?: string;
  };
  duration?: string;
  episodeNumber?: number;
  publishedAt: string;
}

interface PodcastCardProps {
  podcast: Podcast;
}

export function PodcastCard({ podcast }: PodcastCardProps) {
  const formattedDate = new Date(podcast.publishedAt).toLocaleDateString(
    "nb-NO",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <Link
      href={`/podkast/${podcast.slug}`}
      className="group block bg-muted/50 rounded-2xl overflow-hidden hover:bg-muted transition-colors"
    >
      <div className="relative aspect-square w-full bg-muted">
        {podcast.coverImage ? (
          <Image
            src={getMediaUrl(podcast.coverImage.url)}
            alt={podcast.coverImage.alt || podcast.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
            <Play className="w-12 h-12 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {podcast.episodeNumber && <span>Ep. {podcast.episodeNumber}</span>}
          {podcast.episodeNumber && podcast.duration && <span>·</span>}
          {podcast.duration && <span>{podcast.duration}</span>}
        </div>
        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {podcast.title}
        </h3>
        {podcast.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {podcast.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-3">{formattedDate}</p>
      </div>
    </Link>
  );
}
