import { BlockLink } from "@/components/block-link";
import {
  type MediaResource,
  PayloadImage,
  pickImageSource,
  resolveMediaUrl,
} from "@/components/payload-image";
import {
  Carousel,
  type CarouselEffect,
  type CarouselItem,
  type CarouselPresentation,
  type CarouselProps,
} from "@poynt/ui";
import { getImageProps } from "next/image";

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
 * `sizes` per antall synlige slides — speiler `BASIS` i karusellen, med
 * containerbredden (max-w-6xl ≈ 1152 px) som tak på store skjermer. Uten
 * dette faller `<PayloadImage fill>` tilbake på `100vw` og henter altfor store
 * bilder.
 */
const SLIDE_SIZES: Record<number, string> = {
  1: "(min-width: 1280px) 820px, (min-width: 1024px) 70vw, (min-width: 640px) 78vw, 86vw",
  2: "(min-width: 1280px) 580px, (min-width: 640px) 50vw, 85vw",
  3: "(min-width: 1280px) 390px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw",
  4: "(min-width: 1280px) 290px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw",
  5: "(min-width: 1280px) 230px, (min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw",
};

/**
 * Logoene vises maks ~200 CSS-px brede (se `LogoSlide`). Med fast bredde lager
 * next/image en 1x/2x-srcset gjennom bildeoptimaliseringen, i stedet for at
 * originalen (som kan være flere tusen piksler) lastes rått.
 *
 * Kilden er `sizes.large` (maks 2400 px), ikke originalen: Vercels
 * bildeoptimalisering gir opp på gigantiske kilder (f.eks. en 13959 px bred
 * logo-PNG) og sender originalen urørt med 60 s cache.
 */
const LOGO_WIDTH = 220;

function logoImageProps(image: MediaResource | null) {
  const source = image ? pickImageSource(image) : null;
  if (!source) return {};
  const ratio =
    image?.width && image?.height ? image.width / image.height : undefined;
  const { props } = getImageProps({
    src: source.src,
    alt: "",
    width: LOGO_WIDTH,
    height: Math.round(LOGO_WIDTH / (ratio ?? 3)),
  });
  return { src: props.src, srcSet: props.srcSet };
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
  const perView = (Number(slidesPerView ?? 3) || 3) as NonNullable<
    CarouselProps["slidesPerView"]
  >;
  const imageSizes = SLIDE_SIZES[perView] ?? SLIDE_SIZES[3];

  const items: CarouselItem[] = (slides ?? []).map((slide, index) => {
    const kind = (slide.kind ?? "image") as NonNullable<CarouselItem["kind"]>;
    const image =
      typeof slide.image === "object" && slide.image !== null
        ? slide.image
        : null;
    const logo = kind === "logo" ? logoImageProps(image) : null;

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
          <PayloadImage
            media={image}
            fill
            sizes={imageSizes}
            className="object-cover"
          />
        ) : undefined,
      src: kind === "video" ? resolveMediaUrl(slide.videoFile) : logo?.src,
      srcSet: logo?.srcSet,
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
      slidesPerView={perView}
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
