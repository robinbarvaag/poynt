import { BlockLink } from "@/components/block-link";
import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import {
  Carousel,
  type CarouselEffect,
  type CarouselItem,
  type CarouselPresentation,
  type CarouselProps,
} from "@poynt/ui";

type Media = MediaResource | string | number | null | undefined;

interface SlideProps {
  id?: string | null;
  kind?: string | null;
  image?: Media;
  videoFile?: Media;
  poster?: Media;
  eyebrow?: string | null;
  title?: string | null;
  text?: string | null;
  href?: string | null;
}

interface CarouselBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  slides?: SlideProps[] | null;
  presentation?: string | null;
  effect?: string | null;
  slidesPerView?: string | null;
  aspect?: string | null;
  loop?: boolean | null;
  autoScroll?: boolean | null;
  autoplaySeconds?: number | null;
  showArrows?: boolean | null;
  showDots?: boolean | null;
}

/**
 * Wrapper som mapper Payload-blokken `carousel` til presentasjons-komponenten
 * `Carousel` i @poynt/ui. Bilder sendes som ferdige `PayloadImage`-noder (så
 * de går gjennom next/image med blur-plassholder); logo og video sendes som
 * rå URL-er, siden karusellen styrer den visningen selv.
 */
export function CarouselBlock({
  eyebrow,
  title,
  intro,
  slides,
  presentation,
  effect,
  slidesPerView,
  aspect,
  loop,
  autoScroll,
  autoplaySeconds,
  showArrows,
  showDots,
}: CarouselBlockProps) {
  const items: CarouselItem[] = (slides ?? []).map((slide, index) => {
    const kind = (slide.kind ?? "image") as NonNullable<CarouselItem["kind"]>;
    const image =
      typeof slide.image === "object" && slide.image !== null
        ? slide.image
        : null;

    return {
      // Logoene balanseres på flate, ikke høyde — da trenger karusellen å
      // vite formatet på hver enkelt logo.
      aspectRatio:
        image?.width && image?.height ? image.width / image.height : undefined,
      id: slide.id ?? `slide-${index}`,
      kind,
      // Logo rendres som en fri-stående, object-contain-logo av karusellen —
      // der vil vi ha rå src, ikke en fill-node.
      media:
        kind === "image" && image?.url ? (
          <PayloadImage media={image} fill className="object-cover" />
        ) : undefined,
      src:
        kind === "video"
          ? resolveMediaUrl(slide.videoFile)
          : kind === "logo"
            ? resolveMediaUrl(slide.image)
            : undefined,
      poster: resolveMediaUrl(slide.poster),
      alt: image?.alt ?? slide.title ?? undefined,
      eyebrow: slide.eyebrow ?? undefined,
      title: slide.title ?? undefined,
      text: slide.text ?? undefined,
      href: slide.href ?? undefined,
    };
  });

  return (
    <Carousel
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      items={items}
      presentation={(presentation ?? "media") as CarouselPresentation}
      effect={(effect ?? "none") as CarouselEffect}
      slidesPerView={
        (Number(slidesPerView ?? 3) || 3) as NonNullable<
          CarouselProps["slidesPerView"]
        >
      }
      aspect={(aspect ?? "video") as NonNullable<CarouselProps["aspect"]>}
      loop={loop ?? true}
      autoScroll={autoScroll ?? false}
      autoplay={autoplaySeconds ?? 0}
      showArrows={showArrows ?? true}
      showDots={showDots ?? true}
      linkComponent={BlockLink}
    />
  );
}
