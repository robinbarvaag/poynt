"use client";

import { cn } from "../../lib/utils";
import { useWebFont } from "./use-web-font";

export interface FontSpecimenProps {
  /** Font-familienavn, f.eks. «Bricolage Grotesque». */
  fontFamily: string;
  /** Rolle-etikett over prøven («Overskrift», «Brødtekst»). */
  role?: string;
  /** Prøvetekst — default «Aa Bb Cc». */
  sampleText?: string;
  className?: string;
}

/**
 * Typografi-prøve: en stor «Aa Bb Cc» rendret i den valgte fonten, med
 * fontnavn og rolle. Laster fonten fra Google Fonts for live forhåndsvisning;
 * faller pent tilbake til system-serif/sans hvis den ikke finnes der.
 */
export function FontSpecimen({
  fontFamily,
  role,
  sampleText = "Aa Bb Cc",
  className,
}: FontSpecimenProps) {
  useWebFont(fontFamily);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10",
        className
      )}
    >
      {role && (
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-[0.14em]">
          {role}
        </span>
      )}
      <p
        className="text-4xl leading-tight md:text-5xl"
        style={{ fontFamily: `"${fontFamily}", sans-serif` }}
      >
        {sampleText}
      </p>
      <p
        className="text-muted-foreground text-sm"
        style={{ fontFamily: `"${fontFamily}", sans-serif` }}
      >
        {fontFamily}
      </p>
    </div>
  );
}
