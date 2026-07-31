"use client";

import type {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
} from "embla-carousel";
import AutoScroll from "embla-carousel-auto-scroll";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Card } from "../card";
import { Container } from "../container";
import { Reveal } from "../motion";
import { SectionHeader } from "../section-header";
import { Heading, Text } from "../typography";
import {
  type CarouselEffect,
  applyCarouselTween,
  resetCarouselTween,
} from "./carousel-tween";

export type { CarouselEffect } from "./carousel-tween";

/** Hva slags innhold ligger i slide-en. Styrer hvordan den rendres. */
export type CarouselItemKind = "image" | "video" | "logo" | "content";

/**
 * Hvordan bilde-/video-slides settes sammen med eventuell tekst.
 * - `media`   — ren flate, ingen tekst. Standard: media er hele poenget.
 * - `overlay` — kort tittel oppå bildet. Maks to linjer, ingen brødtekst.
 * - `card`    — bilde øverst, tekst under. For slides som skal presentere noe.
 *
 * Gjelder ikke `logo`/`content`, som har sin egen faste form.
 */
export type CarouselPresentation = "media" | "overlay" | "card";

export interface CarouselItem {
  /** Stabil nøkkel. Faller tilbake på indeks. */
  id?: string;
  /** Default `image`. */
  kind?: CarouselItemKind;
  /**
   * Ferdig media-node (typisk `<PayloadImage fill />` fra appen, så @poynt/ui
   * slipper å kjenne til next/image). Vinner over `src`.
   */
  media?: ReactNode;
  /** Bilde-/video-URL når du ikke sender inn en ferdig `media`-node. */
  src?: string;
  /** Plakatbilde for `kind: "video"`. */
  poster?: string;
  alt?: string;
  /**
   * Bildets bredde/høyde-forhold. Brukes til å balansere logoer optisk
   * (se `LogoSlide`) — uten den faller logoen tilbake på lik høyde.
   */
  aspectRatio?: number;
  eyebrow?: string;
  title?: string;
  text?: string;
  /** Gjør hele slide-en klikkbar. */
  href?: string;
}

export interface CarouselLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export interface CarouselProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  items: CarouselItem[];
  /** Hvordan bilde-/video-slides settes sammen med tekst. Default `media`. */
  presentation?: CarouselPresentation;
  /** Bevegelses-effekt knyttet til dra-posisjonen. Default `none`. */
  effect?: CarouselEffect;
  /** Hvor mange slides som vises samtidig på desktop. Default 3. */
  slidesPerView?: 1 | 2 | 3 | 4 | 5;
  /** Formatet på media-ramma. Default `video` (16:9). */
  aspect?: "wide" | "video" | "square" | "portrait" | "auto";
  /** Hopp fra siste til første. Default true. */
  loop?: boolean;
  /**
   * Hvor slide-en låser seg. Default `start`, men `center` når `slidesPerView`
   * er 1 — da stikker naboen fram på BEGGE sider i stedet for bare til høyre.
   */
  align?: "start" | "center";
  /** Sekunder mellom automatiske bytter. 0 = av (default). */
  autoplay?: number;
  /**
   * Kontinuerlig, jevn scrolling uten stopp — «marquee»-modusen som passer
   * logo-striper. Overstyrer `autoplay` og tvinger loop.
   */
  autoScroll?: boolean;
  /** Piler oppe til høyre. Default true. */
  showArrows?: boolean;
  /** Prikker under. Default true. */
  showDots?: boolean;
  linkComponent?: ComponentType<CarouselLinkProps>;
  className?: string;
}

const BASIS: Record<number, string> = {
  // Én om gangen er ALDRI full bredde: da leses karusellen som et stillbilde,
  // og nabo-effektene (scale/opacity/depth) er usynlige fordi naboene ligger
  // utenfor viewporten. Slide-en holdes smalere enn ramma så naboene stikker
  // fram i begge kanter — hintet om at det finnes mer.
  1: "basis-[86%] sm:basis-[78%] lg:basis-[70%]",
  2: "basis-[85%] sm:basis-1/2",
  3: "basis-[85%] sm:basis-1/2 lg:basis-1/3",
  4: "basis-[85%] sm:basis-1/2 lg:basis-1/4",
  5: "basis-1/2 sm:basis-1/3 lg:basis-1/5",
};

const ASPECT = {
  wide: "aspect-[21/9]",
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  auto: "",
} as const;

/** Så mange slides vil vi minst ha i en auto-scroll-strøm (se `renderItems`). */
const AUTOSCROLL_MIN_SLIDES = 14;

// Samme fargerotasjon som FeatureGrid, så tekst-slides føles som resten av
// systemet i stedet for en egen dialekt.
const CONTENT_SURFACES = ["saffron", "salmon", "primary"] as const;

/**
 * Karusell bygget på Embla. Én komponent for fire slags innhold — bilde, video,
 * logo og tekstkort — med valgbar bevegelses-effekt (parallax / scale / opacity
 * / depth) som følger fingeren i stedet for å spille av en fast animasjon.
 *
 * Innholds-only (ingen `<section>`/`py-*`) — pakkes av `BlockSection`.
 * Respekterer `prefers-reduced-motion`: da droppes både tween og auto-scroll.
 */
export function Carousel({
  eyebrow,
  title,
  intro,
  items,
  presentation = "media",
  effect = "none",
  slidesPerView = 3,
  aspect = "video",
  loop = true,
  align,
  autoplay = 0,
  autoScroll = false,
  showArrows = true,
  showDots = true,
  linkComponent: LinkComp,
  className,
}: CarouselProps) {
  const reduceMotion = useReducedMotion();
  const activeEffect: CarouselEffect = reduceMotion ? "none" : effect;

  // Én om gangen sentreres, så naboene stikker fram i begge kanter. Flere
  // synlige låses til venstre som før — der gir starten en rolig venstrelinje
  // med resten av sida.
  const activeAlign = align ?? (slidesPerView === 1 ? "center" : "start");

  const options = useMemo<EmblaOptionsType>(
    () => ({
      loop: autoScroll ? true : loop,
      align: activeAlign,
      // Auto-scroll er en jevn strøm, ikke snapping — dragFree gjør at et
      // manuelt sveip glir videre i samme ånd i stedet for å låse seg.
      dragFree: autoScroll,
      containScroll: loop || autoScroll ? undefined : "trimSnaps",
    }),
    [activeAlign, autoScroll, loop]
  );

  const plugins = useMemo(() => {
    if (reduceMotion) return [];
    if (autoScroll) {
      return [
        AutoScroll({
          // Rolig tempo: en logo-stripe er et troverdighets-element, ikke en
          // ticker. Går den fort leses den som støy, og navnene rekker ikke
          // å feste seg. Merkbar bevegelse, men uten hastverk.
          speed: 0.9,
          stopOnInteraction: false,
          stopOnMouseEnter: true,
        }),
      ];
    }
    if (autoplay > 0) {
      return [
        Autoplay({
          delay: autoplay * 1000,
          stopOnInteraction: true,
          stopOnMouseEnter: true,
        }),
      ];
    }
    return [];
  }, [autoScroll, autoplay, reduceMotion]);

  const [emblaRef, emblaApi] = useEmblaCarousel(options, plugins);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  const onInit = useCallback((api: EmblaCarouselType) => {
    setSnapCount(api.scrollSnapList().length);
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
    return () => {
      emblaApi.off("reInit", onInit).off("reInit", onSelect);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onInit, onSelect]);

  // Tween-en skrives rett på DOM-nodene ved hver scroll-frame — den kan ikke gå
  // via React-state uten å tape en frame per bevegelse.
  useEffect(() => {
    if (!emblaApi) return;
    if (activeEffect === "none") {
      resetCarouselTween(emblaApi);
      return;
    }
    const run = (api: EmblaCarouselType, eventName: EmblaEventType) =>
      applyCarouselTween(api, activeEffect, eventName);

    applyCarouselTween(emblaApi, activeEffect);
    emblaApi.on("reInit", run).on("scroll", run).on("slideFocus", run);
    return () => {
      emblaApi.off("reInit", run).off("scroll", run).off("slideFocus", run);
      resetCarouselTween(emblaApi);
    };
  }, [emblaApi, activeEffect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  // Auto-scroll er en sammenhengende strøm: Embla kan bare gå i ring når
  // slidene til sammen er bredere enn viewporten, og en logo-stripe med sju
  // logoer er akkurat på grensa — da rykker loopen ved skjøten. I stedet for
  // å be redaktøren lime inn de samme logoene flere ganger, gjentar vi lista
  // selv til det er nok av dem. Dublettene skjules for skjermlesere.
  const renderItems = useMemo(() => {
    const single = items.map((item) => ({ item, duplicate: false }));
    if (!autoScroll || items.length === 0) return single;
    const repeats = Math.ceil(AUTOSCROLL_MIN_SLIDES / items.length);
    if (repeats <= 1) return single;
    return Array.from({ length: repeats }, (_, round) =>
      items.map((item) => ({ item, duplicate: round > 0 }))
    ).flat();
  }, [autoScroll, items]);

  if (items.length === 0) return null;

  const isParallax = activeEffect === "parallax";
  const isLogoRail = items.every((item) => item.kind === "logo");
  const basis = BASIS[slidesPerView] ?? BASIS[3];
  const withArrows = showArrows && !autoScroll;
  const withDots = showDots && !autoScroll && snapCount > 1;

  return (
    <Container padding="none" className={className}>
      <Reveal>
        <div
          className={cn(
            "flex flex-col gap-6",
            // Når karusellen har både header og piler ligger pilene på samme
            // linje som tittelen (moderne rail-mønster) i stedet for under.
            withArrows && (eyebrow || title || intro) && "md:gap-8"
          )}
        >
          {(eyebrow || title || intro || withArrows) && (
            <div className="flex items-end justify-between gap-6">
              <SectionHeader
                eyebrow={eyebrow}
                title={title}
                intro={intro}
                reveal={false}
                className="mb-0"
              />
              {withArrows && (
                <div className="hidden shrink-0 gap-2 md:flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollPrev}
                    disabled={!canPrev}
                    aria-label="Forrige"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={scrollNext}
                    disabled={!canNext}
                    aria-label="Neste"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Viewport. Negativ margin + padding på slidene gir mellomrommet. */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div
              className={cn(
                "flex touch-pan-y",
                isLogoRail ? "-ml-8 items-center" : "-ml-4 md:-ml-6"
              )}
            >
              {renderItems.map(({ item, duplicate }, index) => (
                <CarouselSlide
                  key={`${item.id ?? item.title ?? item.src ?? "slide"}-${index}`}
                  item={item}
                  index={index}
                  aspect={aspect}
                  presentation={presentation}
                  parallax={isParallax}
                  duplicate={duplicate}
                  className={cn(
                    "min-w-0 flex-none",
                    isLogoRail
                      ? "basis-1/2 pl-8 sm:basis-1/3 lg:basis-1/5"
                      : cn(basis, "pl-4 md:pl-6")
                  )}
                  linkComponent={LinkComp}
                />
              ))}
            </div>
          </div>

          {withDots && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: snapCount }, (_, index) => (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: prikkene ER indekser
                  key={index}
                  type="button"
                  onClick={() => scrollTo(index)}
                  aria-label={`Gå til ${index + 1}`}
                  aria-current={index === selectedIndex}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 ease-out",
                    index === selectedIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-foreground/20 hover:bg-foreground/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </Reveal>
    </Container>
  );
}

interface CarouselSlideProps {
  item: CarouselItem;
  index: number;
  aspect: NonNullable<CarouselProps["aspect"]>;
  presentation: CarouselPresentation;
  parallax: boolean;
  /** Gjentakelse i en auto-scroll-strøm — visuell fyll, ikke nytt innhold. */
  duplicate?: boolean;
  className?: string;
  linkComponent?: ComponentType<CarouselLinkProps>;
}

function CarouselSlide({
  item,
  index,
  aspect,
  presentation,
  parallax,
  duplicate,
  className,
  linkComponent: LinkComp,
}: CarouselSlideProps) {
  const kind = item.kind ?? "image";
  const mediaProps = { item, kind, aspect, parallax };
  const body =
    kind === "logo" ? (
      <LogoSlide item={item} />
    ) : kind === "content" ? (
      <ContentSlide item={item} index={index} />
    ) : presentation === "card" ? (
      <CardSlide {...mediaProps} />
    ) : presentation === "overlay" ? (
      <OverlaySlide {...mediaProps} />
    ) : (
      <MediaSlide {...mediaProps} />
    );

  // `data-carousel-tween` er flata scale/opacity skrives på — den ligger inni
  // slide-en så mellomrommet (pl-*) ikke skaleres med.
  const inner = (
    <div
      data-carousel-tween=""
      className="h-full transition-none will-change-transform"
    >
      {body}
    </div>
  );

  return (
    <div
      className={className}
      aria-hidden={duplicate || undefined}
      // Dublettene skal ikke kunne tabbes inn i — de er samme innhold to ganger.
      inert={duplicate || undefined}
    >
      {item.href ? (
        LinkComp ? (
          <LinkComp
            href={item.href}
            className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {inner}
          </LinkComp>
        ) : (
          <a
            href={item.href}
            className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {inner}
          </a>
        )
      ) : (
        inner
      )}
    </div>
  );
}

/**
 * Selve media-ramma: fast format, avrundet, med parallax-laget inni. Delt av
 * både den rene media-visningen og kortet, så bilde og video ser identisk ut
 * uansett hvordan slide-en ellers er satt sammen.
 */
function MediaFrame({
  item,
  kind,
  aspect,
  parallax,
  className,
}: {
  item: CarouselItem;
  kind: CarouselItemKind;
  aspect: NonNullable<CarouselProps["aspect"]>;
  parallax: boolean;
  className?: string;
}) {
  const media =
    item.media ??
    (item.src ? (
      kind === "video" ? (
        // Stille loop-video: det er en flate i en karusell, ikke en avspiller.
        // Trenger man kontroller er `VideoPlayer` riktig komponent.
        <video
          src={item.src}
          poster={item.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={item.alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={item.src}
          alt={item.alt ?? ""}
          className="h-full w-full object-cover"
        />
      )
    ) : null);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        ASPECT[aspect],
        className
      )}
    >
      {media && (
        <div
          data-carousel-layer=""
          className={cn(
            "will-change-transform",
            // Parallax flytter laget sideveis, så det må være bredere enn
            // ramma — ellers blottlegges kanten under draget.
            parallax
              ? "absolute top-0 bottom-0 -left-[15%] w-[130%]"
              : "absolute inset-0"
          )}
        >
          {media}
        </div>
      )}
    </div>
  );
}

/** Ren bilde-/videoflate. Ingen tekst — media er hele poenget. */
function MediaSlide(props: {
  item: CarouselItem;
  kind: CarouselItemKind;
  aspect: NonNullable<CarouselProps["aspect"]>;
  parallax: boolean;
}) {
  return <MediaFrame {...props} className="h-full rounded-3xl" />;
}

/**
 * Kort tittel lagt oppå bildet. Bevisst STRENG: én linje etikett og maks to
 * linjer tittel, ingen brødtekst — teksten ligger i en boks med fast høyde, og
 * alt som ikke får plass blir klippet vekk øverst. Skal slide-en bære en
 * ingress hører den hjemme i `card`-visningen, ikke her.
 */
function OverlaySlide({
  item,
  kind,
  aspect,
  parallax,
}: {
  item: CarouselItem;
  kind: CarouselItemKind;
  aspect: NonNullable<CarouselProps["aspect"]>;
  parallax: boolean;
}) {
  return (
    <div className="group relative h-full">
      <MediaFrame
        item={item}
        kind={kind}
        aspect={aspect}
        parallax={parallax}
        className="h-full rounded-3xl"
      />
      {(item.eyebrow || item.title) && (
        <div className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-gradient-to-t from-foreground/90 via-foreground/50 to-transparent p-5 pt-16 text-background">
          {item.eyebrow && (
            <span className="block truncate font-heading font-semibold text-background/75 text-xs uppercase tracking-[0.2em]">
              {item.eyebrow}
            </span>
          )}
          {item.title && (
            <span className="mt-1.5 block line-clamp-2 font-bold font-heading text-lg leading-snug md:text-xl">
              {item.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Redaksjonelt kort: bilde øverst, tekst under. Teksten flyter naturlig i
 * stedet for å ligge oppå media, så ingenting klippes uansett hvor lang
 * tittelen er — riktig valg når slide-en faktisk skal presentere noe.
 */
function CardSlide({
  item,
  kind,
  aspect,
  parallax,
}: {
  item: CarouselItem;
  kind: CarouselItemKind;
  aspect: NonNullable<CarouselProps["aspect"]>;
  parallax: boolean;
}) {
  return (
    <Card className="h-full gap-0 overflow-hidden rounded-3xl py-0 transition-transform duration-300 group-hover/card:-translate-y-1">
      <MediaFrame
        item={item}
        kind={kind}
        aspect={aspect === "auto" ? "video" : aspect}
        parallax={parallax}
      />
      <div className="flex flex-1 flex-col p-6">
        {item.eyebrow && (
          <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.2em]">
            {item.eyebrow}
          </span>
        )}
        {item.title && (
          <span className="mt-2 block line-clamp-2 font-bold font-heading text-foreground text-lg leading-snug">
            {item.title}
          </span>
        )}
        {item.text && (
          <Text
            customStyles="mt-2 line-clamp-3 text-muted-foreground text-sm"
            color="inherit"
          >
            {item.text}
          </Text>
        )}
      </div>
    </Card>
  );
}

function ContentSlide({ item, index }: { item: CarouselItem; index: number }) {
  const surface = CONTENT_SURFACES[index % CONTENT_SURFACES.length];
  return (
    <Card
      surface={surface}
      className="h-full gap-0 rounded-3xl p-8 transition-transform duration-300 group-hover/card:-translate-y-1"
    >
      {item.eyebrow && (
        <span className="font-heading font-semibold text-current/70 text-xs uppercase tracking-[0.2em]">
          {item.eyebrow}
        </span>
      )}
      {item.title && (
        <Heading
          variant="h3"
          size="display-sm"
          color="inherit"
          weight="bold"
          customStyles="mt-3 leading-tight"
        >
          {item.title}
        </Heading>
      )}
      {item.text && (
        <Text color="inherit" customStyles="mt-4 text-current/80">
          {item.text}
        </Text>
      )}
    </Card>
  );
}

/**
 * Skalerer en logo slik at den dekker omtrent samme FLATE som de andre, i
 * stedet for samme høyde.
 *
 * Lik høyde er den vanlige normen, men den svikter når logoene har ulik
 * geometri: en bred wordmark får mye mer flate enn en stablet logo (merke over
 * navn) på samme høyde, og den stablede leses som for liten. Ved lik flate er
 * visningshøyden omvendt proporsjonal med kvadratrota av bredde/høyde-forholdet.
 * Klemt til et fornuftig spenn, så ingen logo verken forsvinner eller tar over.
 */
function logoScale(aspectRatio?: number): number {
  if (!aspectRatio || !Number.isFinite(aspectRatio) || aspectRatio <= 0) {
    return 1;
  }
  // Referansen er en typisk liggende wordmark — den får skala 1.
  const scale = Math.sqrt(3.2 / aspectRatio);
  return Math.min(Math.max(scale, 0.8), 1.8);
}

function LogoSlide({ item }: { item: CarouselItem }) {
  const label = item.title ?? item.alt ?? "";
  const scale = logoScale(item.aspectRatio);
  return (
    <div className="flex h-24 items-center justify-center [--logo-h:2.25rem] md:[--logo-h:2.75rem]">
      {item.media ??
        (item.src ? (
          <img
            src={item.src}
            alt={label}
            style={{ height: `calc(var(--logo-h) * ${scale})` }}
            className="w-auto max-w-full object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
          />
        ) : (
          // Wordmark-fallbacken må holdes på ÉN linje: to linjer i en fast-høyde
          // tile flyter over kantene og kolliderer med naboene i stripa.
          // Lange navn skaleres ned i stedet for å brytes.
          <span className="block max-w-full truncate whitespace-nowrap font-bold font-heading text-foreground/35 text-lg leading-none transition-colors duration-300 hover:text-foreground/70 md:text-xl">
            {label}
          </span>
        ))}
    </div>
  );
}
