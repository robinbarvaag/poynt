"use client";

import type {
  EmblaCarouselType,
  EmblaEventType,
  EmblaOptionsType,
} from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { useReducedMotion } from "framer-motion";
import type React from "react";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";

export interface CoverflowItem {
  id: string | number;
  /** Selve «coveret» — flata som roterer i 3D. Typisk et kvadratisk bilde. */
  cover: ReactNode;
  /**
   * Tekst som hører til coveret (tittel, meta). Vises UNDER stabelen, bare for
   * det aktive coveret — akkurat som iTunes viste tittelen under Cover Flow.
   * Ligger utenfor 3D-flata så teksten alltid er rett og lesbar.
   */
  caption?: ReactNode;
  /** Gjør cover + caption klikkbare. */
  href?: string;
  /** Åpne lenka i ny fane (eksterne lenker, f.eks. Spotify). */
  external?: boolean;
}

export interface CoverflowLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export interface CoverflowProps {
  items: CoverflowItem[];
  /** Hopp fra siste til første når det er nok covers. Default true. */
  loop?: boolean;
  /** Prikker under. Default true. */
  showDots?: boolean;
  /** Tilgjengelig navn på karusellen. */
  label?: string;
  /** Hvilket cover som står i front ved start. Default 0. */
  startIndex?: number;
  /**
   * Strekk viewporten fra skjermkant til skjermkant, uavhengig av containeren
   * rundt. Da glir naboene ut av skjermen i stedet for å bli klippet ved
   * innholdskanten — og det er tydelig at det finnes mer på begge sider.
   * Captions og prikker holder seg innenfor innholdsbredden. Default false.
   */
  bleed?: boolean;
  linkComponent?: ComponentType<CoverflowLinkProps>;
  className?: string;
}

const COVERFLOW_TWEEN_ATTR = "data-coverflow-tween";

/**
 * Utslag per snap-avstand. `d` er avstanden i snap-enheter fra det aktive
 * coveret (0 = i front, ±1 = nærmeste nabo). Første nabo får det store
 * utslaget; de bak igjen pakkes tett inntil hverandre som en bunke — det er
 * bunken bak som gir Cover Flow-følelsen, ikke ett cover på hver side.
 */
const NEAR_ROTATE = 48; // grader for nærmeste nabo
const FAR_ROTATE = 10; // ekstra grader per ledd bakover
const NEAR_SHIFT = 42; // prosent av egen bredde nærmeste nabo trekkes inn
const FAR_SHIFT = 64; // prosent ekstra per ledd bakover (bunken)
const NEAR_DEPTH = 60; // px bakover for nærmeste nabo
const FAR_DEPTH = 40; // px ekstra per ledd
const NEAR_BLUR = 1.5; // px uskarphet på nærmeste nabo
const FAR_BLUR = 1.5; // px ekstra per ledd
const MAX_DISTANCE = 3;
// Perspektivet ligger i selve transformen, ikke på en forelder: Embla flytter
// containeren med sin egen transform, og et 3D-rom som skal overleve gjennom
// den (preserve-3d) flates ut i praksis. Per-element-perspektiv er robust, og
// dybdesorteringen gjøres med z-index i stedet.
const PERSPECTIVE = 900; // px

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Cover Flow: det aktive coveret står flatt i front, naboene er dreid innover
 * og skjøvet bakover, og legger seg delvis bak hverandre. Effekten følger
 * fingeren — den regnes ut av dra-posisjonen ved hver scroll-frame, ikke
 * spilles av som en fast animasjon.
 */
function applyCoverflowTween(
  emblaApi: EmblaCarouselType,
  _eventName?: EmblaEventType
): void {
  const engine = emblaApi.internalEngine();
  const scrollProgress = emblaApi.scrollProgress();
  const snapList = emblaApi.scrollSnapList();
  const slideNodes = emblaApi.slideNodes();

  for (const [snapIndex, scrollSnap] of snapList.entries()) {
    const slidesInSnap = engine.slideRegistry[snapIndex];
    if (!slidesInSnap) continue;

    for (const slideIndex of slidesInSnap) {
      // Bunken trekkes langt inn mot midten, så covers Embla regner som
      // utenfor viewporten er likevel synlige. Oppdater alle, også under
      // draget — det er en håndfull noder.
      let diffToTarget = scrollSnap - scrollProgress;

      if (engine.options.loop) {
        for (const loopItem of engine.slideLooper.loopPoints) {
          const target = loopItem.target();
          if (slideIndex !== loopItem.index || target === 0) continue;
          const sign = Math.sign(target);
          if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
          if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
        }
      }

      // Merk: `distance` er POSITIV for covers til HØYRE for det aktive.
      const distance = clamp(
        diffToTarget * snapList.length,
        -MAX_DISTANCE,
        MAX_DISTANCE
      );
      const magnitude = Math.abs(distance);
      const side = Math.sign(distance);
      const near = Math.min(magnitude, 1);
      const far = Math.max(magnitude - 1, 0);

      const slide = slideNodes[slideIndex];
      if (!slide) continue;
      const target =
        slide.querySelector<HTMLElement>(`[${COVERFLOW_TWEEN_ATTR}]`) ?? slide;

      const rotate = -side * (NEAR_ROTATE * near + FAR_ROTATE * far);
      const shift = -side * (NEAR_SHIFT * near + FAR_SHIFT * far);
      const depth = -(NEAR_DEPTH * near + FAR_DEPTH * far);
      const blur = NEAR_BLUR * near + FAR_BLUR * far;

      target.style.transform = `perspective(${PERSPECTIVE}px) translateX(${shift}%) translateZ(${depth}px) rotateY(${rotate}deg)`;
      // Coverne bak er uskarpe og litt mørkere — dybdeskarphet, som et
      // kamera: det du ser på er skarpt, resten er bakgrunn.
      target.style.filter =
        magnitude < 0.01
          ? ""
          : `blur(${blur.toFixed(2)}px) brightness(${(1 - 0.12 * near - 0.1 * far).toFixed(3)})`;
      target.style.opacity = `${1 - 0.15 * far}`;
      // Uten felles 3D-rom er det z-index som avgjør hvem som ligger foran.
      slide.style.zIndex = `${Math.round(100 - magnitude * 10)}`;
    }
  }
}

function resetCoverflowTween(emblaApi: EmblaCarouselType): void {
  for (const slide of emblaApi.slideNodes()) {
    const target =
      slide.querySelector<HTMLElement>(`[${COVERFLOW_TWEEN_ATTR}]`) ?? slide;
    target.style.transform = "";
    target.style.filter = "";
    target.style.opacity = "";
    slide.style.zIndex = "";
  }
}

/**
 * Karusell i Cover Flow-stil (gammel iTunes): ett cover i front, naboene dreid
 * bakover på hver side, og tittelen til det aktive coveret under. Bygget på
 * Embla, så sveip/dra/tastatur/loop oppfører seg som resten av karusellene.
 *
 * Laget for smale skjermer der et rutenett ville stablet kortene under
 * hverandre. Innholds-only (ingen `<section>`/`py-*`) — pakkes av den som
 * bruker den. Respekterer `prefers-reduced-motion`: da droppes 3D-dreiningen
 * og naboene krymper bare litt i stedet.
 */
export function Coverflow({
  items,
  loop = true,
  showDots = true,
  label = "Karusell",
  startIndex = 0,
  bleed = false,
  linkComponent: LinkComp,
  className,
}: CoverflowProps) {
  const reduceMotion = useReducedMotion();

  // Loopen låner covers fra motsatt ende. Med færre enn tre ville det samme
  // coveret stått på begge sider av det aktive — da stopper vi i endene.
  const activeLoop = loop && items.length >= 3;

  const options = useMemo<EmblaOptionsType>(
    () => ({
      loop: activeLoop,
      align: "center",
      startIndex,
      containScroll: activeLoop ? undefined : "keepSnaps",
      skipSnaps: false,
    }),
    [activeLoop, startIndex]
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const [snapCount, setSnapCount] = useState(0);

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
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

  // Tween-en skrives rett på DOM-nodene ved hver scroll-frame.
  useEffect(() => {
    if (!emblaApi) return;
    if (reduceMotion) {
      resetCoverflowTween(emblaApi);
      return;
    }
    const run = (api: EmblaCarouselType, eventName: EmblaEventType) =>
      applyCoverflowTween(api, eventName);
    applyCoverflowTween(emblaApi);
    emblaApi.on("reInit", run).on("scroll", run).on("slideFocus", run);
    return () => {
      emblaApi.off("reInit", run).off("scroll", run).off("slideFocus", run);
      resetCoverflowTween(emblaApi);
    };
  }, [emblaApi, reduceMotion]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        emblaApi?.scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        emblaApi?.scrollNext();
      }
    },
    [emblaApi]
  );

  if (items.length === 0) return null;

  const withDots = showDots && snapCount > 1;
  const hasCaptions = items.some((item) => item.caption);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/*
        Viewport. Vertikal luft fordi den nære kanten på et dreid cover stikker
        litt utenfor sin egen boks.
      */}
      <section
        ref={emblaRef}
        className={cn(
          "overflow-hidden py-4",
          bleed && "mx-[calc(50%-50vw)] w-screen"
        )}
        aria-roledescription="karusell"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        <div className="flex touch-pan-y">
          {items.map((item, index) => {
            const active = index === selectedIndex;
            const inner = (
              <div
                data-coverflow-tween=""
                className={cn(
                  "will-change-transform [backface-visibility:hidden]",
                  // Ved redusert bevegelse: ingen 3D, bare en rolig krymp
                  // på naboene så det aktive fortsatt står fram.
                  reduceMotion &&
                    "transition-transform duration-300 ease-out motion-reduce:transition-none",
                  reduceMotion && !active && "scale-90 opacity-70"
                )}
              >
                <div className="overflow-hidden rounded-2xl bg-muted">
                  {item.cover}
                </div>
              </div>
            );
            const linkClass =
              "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl";

            return (
              <div
                key={item.id}
                className="relative min-w-0 flex-none basis-[66%]"
                // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA-mønsteret for karusell-slides er nettopp role="group" + aria-roledescription="slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} av ${items.length}`}
                // Klikk på et cover i bunken henter det fram i stedet for å
                // følge lenka — slik Cover Flow alltid har oppført seg. Bare
                // coveret i front navigerer.
                onClickCapture={
                  active
                    ? undefined
                    : (event) => {
                        event.preventDefault();
                        scrollTo(index);
                      }
                }
              >
                {item.href ? (
                  LinkComp ? (
                    <LinkComp href={item.href} className={linkClass}>
                      {inner}
                    </LinkComp>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {inner}
                    </a>
                  ) : (
                    <UILink href={item.href} className={linkClass}>
                      {inner}
                    </UILink>
                  )
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </section>

      {hasCaptions && (
        // Alle captions ligger i samme grid-celle og bytter med opacity, så
        // høyden ikke hopper når tittel-lengden varierer mellom episodene.
        <div className="grid text-center" aria-live="polite">
          {items.map((item, index) => {
            const active = index === selectedIndex;
            const caption = (
              <div
                className={cn(
                  "px-6 transition-opacity duration-300 ease-out motion-reduce:transition-none",
                  active ? "opacity-100" : "pointer-events-none opacity-0"
                )}
              >
                {item.caption}
              </div>
            );
            return (
              <div
                key={item.id}
                className="[grid-area:1/1]"
                aria-hidden={!active}
                inert={active ? undefined : true}
              >
                {item.href && item.caption ? (
                  LinkComp ? (
                    <LinkComp href={item.href} className="block">
                      {caption}
                    </LinkComp>
                  ) : item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      {caption}
                    </a>
                  ) : (
                    <UILink href={item.href} className="block">
                      {caption}
                    </UILink>
                  )
                ) : (
                  caption
                )}
              </div>
            );
          })}
        </div>
      )}

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
  );
}
