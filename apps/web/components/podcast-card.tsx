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
    }
  );

  return (
    <Link href={`/podkast/${podcast.slug}`} className="group block">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
        {podcast.coverImage ? (
          <Image
            src={getMediaUrl(podcast.coverImage.url)}
            alt={podcast.coverImage.alt || podcast.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-muted-foreground/40 ml-0.5" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
            <Play className="w-5 h-5 text-background ml-0.5" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {podcast.episodeNumber && <span>Ep. {podcast.episodeNumber}</span>}
          {podcast.episodeNumber && podcast.duration && <span>·</span>}
          {podcast.duration && <span>{podcast.duration}</span>}
          {(podcast.episodeNumber || podcast.duration) && <span>·</span>}
          <span>{formattedDate}</span>
        </div>

        <h3 className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {podcast.title}
        </h3>

        {podcast.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {podcast.description}
          </p>
        )}
      </div>
    </Link>
  );
}
