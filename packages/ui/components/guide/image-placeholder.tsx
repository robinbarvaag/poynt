import { cn } from "../../lib/utils";

export interface ImagePlaceholderProps {
  /** Hva bildet skal vise (vises som hint til redaktøren). */
  label?: string;
  /** Fyll hele forelderen (for galleri-/kolonne-celler). */
  fill?: boolean;
  className?: string;
}

/**
 * Pen, merkevare-tro «bilde kommer»-rute. Brukes der kildeinnholdet hadde et
 * bilde vi ikke kunne hente ut (Notion-eksport) — redaktøren ser hva som skal
 * inn og bytter det ut. Bevisst stil, ikke en «ødelagt bilde»-følelse.
 */
export function ImagePlaceholder({
  label,
  fill,
  className,
}: ImagePlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-foreground/15 border-dashed bg-gradient-to-br from-mint/30 via-background to-saffron/20 p-6 text-center",
        fill ? "h-full w-full" : "aspect-[4/3] w-full",
        className
      )}
    >
      <span aria-hidden="true" className="text-3xl opacity-60">
        🖼️
      </span>
      {label && (
        <span className="max-w-xs text-balance text-foreground/60 text-xs leading-snug">
          {label}
        </span>
      )}
    </div>
  );
}
