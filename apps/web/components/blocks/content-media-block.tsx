import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { ContentMedia } from "@poynt/ui";

type MediaRef = MediaResource;

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
    <PayloadImage media={img} fill className="object-cover" />
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
