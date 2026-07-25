import type * as React from "react";
import { cn } from "../../lib/utils";

export type DeviceFrameVariant = "browser" | "phone" | "none";

export interface DeviceFrameProps {
  /** Hvilken ramme: nettleser, telefon, eller ingen (bare avrundet bilde). */
  variant?: DeviceFrameVariant;
  /** Tekst i adressefeltet (kun «browser») — f.eks. «canva.com». */
  url?: string;
  /** Bildetekst under rammen. */
  caption?: string;
  /** Selve bildet/innholdet — typisk et <Image> eller en `ImagePlaceholder`. */
  children: React.ReactNode;
  className?: string;
}

const frameShadow = "shadow-[0_28px_70px_-30px_rgba(0,64,41,0.45)]";

/**
 * Rammer et skjermbilde inn i en nettleser- eller telefon-«chrome» slik at det
 * leses som et faktisk artefakt — ikke en naken, halv-ødelagt boks. Funker like
 * godt rundt en `ImagePlaceholder` (da ser «bilde kommer» fortsatt bevisst ut).
 *
 * Signatur-detalj: trafikklys-prikkene bruker merkevarefargene
 * (salmon/saffron/mint), ikke mac-rød/gul/grønn.
 */
export function DeviceFrame({
  variant = "browser",
  url,
  caption,
  children,
  className,
}: DeviceFrameProps) {
  const media = (
    <div className="*:[img]:block *:[img]:h-auto *:[img]:w-full">
      {children}
    </div>
  );

  let frame: React.ReactNode;

  if (variant === "phone") {
    frame = (
      <div
        className={cn(
          "mx-auto w-full max-w-[300px] rounded-[2.75rem] bg-foreground p-2.5 ring-1 ring-foreground/20",
          frameShadow
        )}
      >
        <div className="overflow-hidden rounded-[2.1rem] bg-background">
          <div className="flex items-center justify-center pt-2.5 pb-1.5">
            <span className="h-1.5 w-16 rounded-full bg-foreground/15" />
          </div>
          {media}
        </div>
      </div>
    );
  } else if (variant === "none") {
    frame = (
      <div
        className={cn(
          "overflow-hidden rounded-3xl ring-1 ring-foreground/10",
          frameShadow
        )}
      >
        {media}
      </div>
    );
  } else {
    frame = (
      <div
        className={cn(
          "overflow-hidden rounded-3xl bg-background ring-1 ring-foreground/10",
          frameShadow
        )}
      >
        <div className="flex items-center gap-3 border-foreground/10 border-b bg-foreground/[0.03] px-4 py-3">
          <div className="flex gap-1.5">
            <span className="size-3 rounded-full bg-accent-2" />
            <span className="size-3 rounded-full bg-accent-1" />
            <span className="size-3 rounded-full bg-accent-3" />
          </div>
          {url && (
            <div className="ml-1 flex-1 truncate rounded-full bg-background px-3 py-1 text-center text-foreground/45 text-xs ring-1 ring-foreground/10">
              {url}
            </div>
          )}
        </div>
        {media}
      </div>
    );
  }

  return (
    <figure className={cn("flex flex-col gap-3", className)}>
      {frame}
      {caption && (
        <figcaption className="text-center text-muted-foreground text-sm">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
