import { getMediaUrl } from "@/lib/media-url";
import { Heading, Text } from "@poynt/ui";
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
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-muted">
        {podcast.coverImage ? (
          <Image
            src={getMediaUrl(podcast.coverImage.url)}
            alt={podcast.coverImage.alt || podcast.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted-foreground/10">
              <Play className="ml-0.5 size-5 text-muted-foreground/40" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground">
            <Play className="ml-0.5 size-5 text-background" />
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Text
          type="div"
          variant="muted"
          customStyles="flex items-center gap-1.5 text-xs"
        >
          {podcast.episodeNumber && <span>Ep. {podcast.episodeNumber}</span>}
          {podcast.episodeNumber && podcast.duration && <span>·</span>}
          {podcast.duration && <span>{podcast.duration}</span>}
          {(podcast.episodeNumber || podcast.duration) && <span>·</span>}
          <span>{formattedDate}</span>
        </Text>

        <Heading
          variant="h4"
          color="foreground"
          weight="medium"
          customStyles="line-clamp-2 leading-snug transition-colors group-hover:text-primary"
        >
          {podcast.title}
        </Heading>

        {podcast.description && (
          <Text variant="muted" customStyles="line-clamp-1">
            {podcast.description}
          </Text>
        )}
      </div>
    </Link>
  );
}
