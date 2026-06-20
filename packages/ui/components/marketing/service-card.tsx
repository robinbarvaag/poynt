import type * as React from "react";
import { cn } from "../../lib/utils";

export interface ServiceCardProps {
  /** Lenke til tjenestesiden (eller en egendefinert CTA-lenke). */
  href: string;
  name: string;
  /**
   * Ferdig formatert pris, f.eks. "5000 kr + mva", "Fra 990 kr" eller
   * "Ta kontakt for pris". Formateringen (priceType/mva) gjøres av appen.
   */
  price?: string;
  shortDescription?: string;
  /** Valgfri ledetekst over navnet, f.eks. en kategori. */
  eyebrow?: string;
  /** Media-slot — f.eks. et `next/image` med `fill className="object-cover"`. */
  image?: React.ReactNode;
  /** Tekst på handlingslenken. Default "Les mer". */
  ctaLabel?: string;
  className?: string;
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * Tjenestekort i redaksjonell «overlappende infokort»-stil: et bilde med et hvitt
 * kort som løftes opp og legger seg delvis oppå bildet. Det rolige, lagdelte
 * uttrykket (+ pris som «… + mva» og en «Les mer»-lenke i stedet for kjøp)
 * signaliserer at dette er en *tjeneste*, ikke et butikkprodukt. Presentasjons-
 * only — appen formaterer pris og kobler `next/image` inn i `image`.
 */
export function ServiceCard({
  href,
  name,
  price,
  shortDescription,
  eyebrow,
  image,
  ctaLabel = "Les mer",
  className,
}: ServiceCardProps) {
  return (
    <a href={href} className={cn("group/service block", className)}>
      <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-muted">
        {image ?? (
          <div className="flex size-full items-center justify-center bg-foreground/5">
            <span
              aria-hidden="true"
              className="size-16 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-foreground/10"
            />
          </div>
        )}
      </div>

      {/* Hvitt infokort som løftes opp og legger seg delvis oppå bildet */}
      <div className="relative z-10 -mt-12 mr-6 ml-0 rounded-2xl bg-background p-5 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] ring-1 ring-foreground/5 transition-transform duration-300 group-hover/service:-translate-y-1.5 md:p-6">
        {eyebrow && (
          <span className="mb-1.5 block font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
            {eyebrow}
          </span>
        )}

        <h3 className="font-bold font-heading text-foreground text-lg leading-snug tracking-tight transition-colors group-hover/service:text-primary">
          {name}
        </h3>

        {price && <p className="mt-1 font-semibold text-primary">{price}</p>}

        {shortDescription && (
          <p className="mt-3 line-clamp-3 text-muted-foreground text-sm leading-relaxed">
            {shortDescription}
          </p>
        )}

        <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-foreground text-sm transition-all group-hover/service:gap-2.5">
          {ctaLabel}
          <ArrowRight />
        </span>
      </div>
    </a>
  );
}
