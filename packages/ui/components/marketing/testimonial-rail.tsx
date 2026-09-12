"use client";

import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { RailBleed } from "./rail-bleed";
import { TestimonialCard, type TestimonialCardProps } from "./testimonial-card";

export interface TestimonialRailItem extends TestimonialCardProps {
  id: string | number;
}

export interface TestimonialRailProps {
  testimonials: TestimonialRailItem[];
  /** Navn for skjermlesere. */
  label?: string;
  className?: string;
}

/**
 * Sitatrad for mobil: ett kort sentrert, naboene stikker fram i begge kanter
 * og går helt ut til skjermkanten (RailBleed). Sitater skal leses i ro, så
 * ingen 3D — naboene tones bare ned slik at det aktive kortet står fram.
 * Bruk sammen med `Testimonials`, som viser rutenettet fra `sm` og opp.
 */
export function TestimonialRail({
  testimonials,
  label = "Kundehistorier",
  className,
}: TestimonialRailProps) {
  // Loopen låner kort fra motsatt ende. Med to kort ville det samme kortet
  // stått på begge sider av det aktive — da stopper vi i endene.
  const loop = testimonials.length >= 3;
  const options = useMemo<EmblaOptionsType>(
    () => ({
      align: "center",
      loop,
      containScroll: loop ? undefined : "trimSnaps",
    }),
    [loop]
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const [selectedIndex, setSelectedIndex] = useState(0);
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

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <RailBleed>
        <section
          ref={emblaRef}
          className="overflow-visible"
          aria-roledescription="karusell"
          aria-label={label}
          onKeyDown={onKeyDown}
        >
          <ul className="-ml-4 flex touch-pan-y">
            {testimonials.map(({ id, ...testimonial }, index) => (
              <li
                key={id}
                className={cn(
                  "min-w-0 flex-none basis-[86%] pl-4 transition-opacity duration-500 ease-out",
                  index !== selectedIndex && "opacity-40"
                )}
                aria-label={`${index + 1} av ${testimonials.length}`}
              >
                <TestimonialCard {...testimonial} className="h-full" />
              </li>
            ))}
          </ul>
        </section>
      </RailBleed>

      {snapCount > 1 && (
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
