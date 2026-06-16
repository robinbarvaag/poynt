import { getMediaUrl } from "@/lib/media-url";
import { ContentMedia } from "@poynt/ui";
import Image from "next/image";

interface MediaRef {
  url?: string | null;
  alt?: string | null;
}

interface ContentMediaBlockProps {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  bullets?: { text: string }[] | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  image?: MediaRef | string | number | null;
  mediaSide?: "left" | "right" | null;
  accent?: "saffron" | "salmon" | "primary" | "mint" | null;
}

/** Mapper Payload-blokken `contentMedia` til ContentMedia i @poynt/ui. */
export function ContentMediaBlock({
  eyebrow,
  title,
  body,
  bullets,
  ctaText,
  ctaUrl,
  image,
  mediaSide,
  accent,
}: ContentMediaBlockProps) {
  const img = typeof image === "object" && image !== null ? image : null;
  const media = img?.url ? (
    <Image
      src={getMediaUrl(img.url)}
      alt={img.alt ?? ""}
      fill
      className="object-cover"
      unoptimized={process.env.NODE_ENV === "development"}
    />
  ) : undefined;

  return (
    <ContentMedia
      eyebrow={eyebrow ?? undefined}
      title={title}
      body={body ?? undefined}
      bullets={(bullets ?? []).map((b) => b.text)}
      cta={ctaText && ctaUrl ? { text: ctaText, href: ctaUrl } : undefined}
      media={media}
      mediaSide={mediaSide ?? undefined}
      accent={accent ?? undefined}
    />
  );
}
