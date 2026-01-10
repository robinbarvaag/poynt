import Image from "next/image";

interface MediaBlockProps {
  media: {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  caption?: string;
}

export function MediaBlockComponent({ media, caption }: MediaBlockProps) {
  return (
    <figure className="my-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <Image
          src={media.url}
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
