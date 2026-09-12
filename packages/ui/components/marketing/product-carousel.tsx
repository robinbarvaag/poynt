"use client";

import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { type ProductAccent, ProductCard } from "./product-card";
import type { ProductGridItem } from "./product-grid";

export interface ProductCarouselProps {
  products: ProductGridItem[];
  /**
   * Overskriftsrad (tittel/lenke) som skal stå på linje med pilene. Sendes
   * inn ferdig, så appen bestemmer typografi og lenkekomponent.
   */
  header?: React.ReactNode;
  /** Navn for skjermlesere når `header` ikke inneholder en overskrift. */
  label?: string;
  className?: string;
}

// Samme roterende aksentpalett som ProductGrid, så et produkt ser likt ut
// enten det står i et rutenett eller i en rad.
const palette: ProductAccent[] = ["saffron", "salmon", "mint"];

/**
 * Produktrad: de samme nøytrale produktkortene som i `ProductGrid`, lagt i en
 * sveipbar Embla-rad. Beregnet på steder der produktene er et innslag på
 * siden — forsiden, «Andre produkter» under et produkt — og ikke selve
 * innholdet (der hører rutenettet hjemme).
 *
 * Bevisst nøktern: ingen parallax, ingen cover-flow. Produktkort bærer pris,
 * merkelapp og tekst, og skal kunne leses i ro. Rytmen kommer fra at neste
 * kort stikker fram i kanten (mobil) og fra pilene i overskriftsraden
 * (desktop). Rader med færre kort enn det er plass til rendres som en vanlig
 * rad uten piler.
 */
export function ProductCarousel({
  products,
  header,
  label = "Produkter",
  className,
}: ProductCarouselProps) {
  const options = useMemo<EmblaOptionsType>(
    () => ({
      align: "start",
      containScroll: "trimSnaps",
      // Sveip flere kort om gangen på brede skjermer i stedet for ett og ett.
      slidesToScroll: "auto",
    }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

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

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  // Pil venstre/høyre når fokus er i raden — Embla har ingen innebygd
  // tastaturstyring.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  // Får alle kortene plass i ramma (snapCount ≤ 1) er pilene støy.
  const scrollable = snapCount > 1;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {(header || scrollable) && (
        <div
          className={cn(
            "flex items-end gap-6",
            header ? "justify-between" : "justify-end"
          )}
        >
          {header}
          {scrollable && (
            <div className="hidden shrink-0 gap-2 md:flex">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                disabled={!canPrev}
                aria-label="Forrige produkter"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={scrollNext}
                disabled={!canNext}
                aria-label="Neste produkter"
              >
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Viewport: negativ margin + padding på kortene gir mellomrommet. Litt
          ekstra luft over/under så hover-løftet og skyggen ikke klippes. */}
      <section
        ref={emblaRef}
        className="-my-3 overflow-hidden py-3"
        aria-roledescription="karusell"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        <ul className="-ml-5 flex touch-pan-y">
          {products.map((product, index) => {
            const { id, featured: _featured, accent, ...rest } = product;
            return (
              <li
                key={id}
                className="min-w-0 flex-none basis-[82%] pl-5 sm:basis-1/2 lg:basis-1/3"
                aria-label={`${index + 1} av ${products.length}`}
              >
                <ProductCard
                  {...rest}
                  className="h-full"
                  accent={accent ?? palette[index % palette.length]}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Prikker bare på mobil, der pilene er skjult — på desktop viser pilene
          allerede hvor i raden man er. */}
      {scrollable && (
        <div className="flex items-center justify-center gap-2 md:hidden">
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
