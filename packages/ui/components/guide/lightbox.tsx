"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type * as React from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

/** Fargetone for hover-sløret og forstørr-pillen. */
export type LightboxTone = "mint" | "salmon";

const toneVeil: Record<LightboxTone, string> = {
  mint: "bg-mint/45",
  salmon: "bg-salmon/45",
};

const tonePill: Record<LightboxTone, string> = {
  mint: "bg-mint text-foreground",
  salmon: "bg-salmon text-foreground",
};

export interface LightboxProps {
  /**
   * Full-størrelse-URL som vises i overlegget. Uten denne er det ingenting å
   * forstørre, og komponenten rendrer bare bildet uråvet (ingen klikk/hover).
   */
  src?: string;
  /** Alt-tekst for full-størrelse-bildet (gjenbrukes som dialog-tittel). */
  alt?: string;
  /** Miniatyr-noden som vises i flyten (typisk et `<PayloadImage>`). */
  children: React.ReactNode;
  /** Valgfri bildetekst som vises under bildet i overlegget. */
  caption?: string;
  /** Tone for hover-sløret og pillen. Standard «mint» (grønn). */
  tone?: LightboxTone;
  /**
   * Klasser på trigger-knappen, slik at kallstedet beholder sin egen
   * bilderamme (avrunding, ring, `*:[img]`-størrelser osv.).
   */
  className?: string;
}

/**
 * Gjør et bilde klikkbart: hover viser et farget slør + «se i full størrelse»,
 * og klikk åpner bildet i et fullskjerms-overlegg (Radix Dialog). Miniatyren
 * sendes som `children` så next/image-optimaliseringen beholdes; overlegget
 * viser en vanlig `<img>` på full URL (monteres først når dialogen åpnes).
 */
export function Lightbox({
  src,
  alt = "",
  children,
  caption,
  tone = "mint",
  className,
}: LightboxProps) {
  if (!src) {
    // Ingen full-URL → ikke gjør bildet klikkbart, bare vis det.
    return <>{children}</>;
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={alt ? `Forstørr: ${alt}` : "Forstørr bildet"}
          className={cn(
            "group/lb relative block w-full cursor-zoom-in",
            className
          )}
        >
          {children}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/lb:opacity-100 group-focus-visible/lb:opacity-100",
              toneVeil[tone]
            )}
          >
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 font-medium text-sm shadow-sm",
                tonePill[tone]
              )}
            >
              <Icon name="maximize" className="size-4" strokeWidth={2} />
              Se i full størrelse
            </span>
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/85 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 focus:outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:p-8"
        >
          <DialogPrimitive.Title className="sr-only">
            {alt || caption || "Bilde i full størrelse"}
          </DialogPrimitive.Title>
          {/* Fullskjerms lukk-knapp bak bildet: klikk «utenfor» motivet lukker
              (à la en vanlig lightbox). Bildet ligger over og fanger sitt klikk. */}
          <DialogPrimitive.Close
            aria-label="Lukk"
            className="absolute inset-0 cursor-zoom-out focus:outline-none"
            tabIndex={-1}
          />
          {/* Vanlig <img>: full-URL er allerede løst, og next/image-fill ville
              vært tungvint i en fri overlegg-boks. */}
          <img
            src={src}
            alt={alt}
            className="relative max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
          {caption && (
            <p className="relative max-w-2xl text-center text-background/80 text-sm">
              {caption}
            </p>
          )}
          <DialogPrimitive.Close
            aria-label="Lukk"
            className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-background"
          >
            <Icon name="x" className="size-5" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
