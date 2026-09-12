import type * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Felles «bleed» for sveipbare rader (karusell, produktrad, sitatrad).
 *
 * Problemet den løser: en rad som klippes hardt ved innholdskanten ser ut som
 * en feil — kortet «bare slutter». Her får raden gå helt ut til skjermkanten,
 * mens alt utenfor innholdsbredden tones ut mot kanten. Selve Embla-viewporten
 * inni beholder innholdsbredden (så første kort står på linje med resten av
 * sida og snappene er uendret); den får bare `overflow-visible`, og det er
 * denne wrapperen som klipper og fader.
 *
 * `--rail-inset` er avstanden fra skjermkant til innholdskant for standard
 * `Container` (maks 72rem + 1rem padding). Masken starter en halv rem utenfor
 * innholdet, så et par piksler scrollbar-skjevhet aldri fader det aktive
 * kortet.
 */
export function RailBleed({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "-my-4 mx-[calc(50%-50vw)] w-screen overflow-hidden px-[var(--rail-inset)] py-4",
        "[--rail-inset:max(1rem,calc((100vw-72rem)/2+1rem))]",
        "[mask-image:linear-gradient(to_right,transparent,black_calc(var(--rail-inset)-0.5rem),black_calc(100%-var(--rail-inset)+0.5rem),transparent)]",
        className
      )}
    >
      {children}
    </div>
  );
}
