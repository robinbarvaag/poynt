import { type MediaResource, PayloadImage } from "@/components/payload-image";

interface MediaBlockProps {
  media: MediaResource;
  caption?: string;
}

export function MediaBlockComponent({ media, caption }: MediaBlockProps) {
  return (
    <figure className="my-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <PayloadImage
          media={media}
          alt={media.alt || caption || ""}
          fill
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
