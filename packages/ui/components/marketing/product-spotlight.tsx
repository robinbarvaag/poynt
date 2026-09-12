import type * as React from "react";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { Card } from "../card";
import { DecoBlob, hashSeed } from "./deco-blob";
import type {
  ProductAccent,
  ProductBadge,
  ProductBadgeTone,
} from "./product-card";

export interface ProductSpotlightProps {
  /** Lenke til produktsiden. Bilde, navn og «Se produktet»-lenken går hit. */
  href: string;
  name: string;
  /** Liten ledetekst over navnet, f.eks. "Anbefalt" eller produkttypen. */
  eyebrow?: string;
  /** Kort tekst — redaktørens egen kobling til innholdet, eller produktets beskrivelse. */
  description?: string;
  /** Pris i kr. Formateres som norsk tall + " kr". */
  price?: number;
  /** Før-pris (gjennomstreket når den er høyere enn `price`). */
  compareAtPrice?: number;
  /** Overstyr prisvisningen helt, f.eks. "Gratis". */
  priceLabel?: string;
  /**
   * Media-slot — send f.eks. et `next/image` med `fill`. Hele bildet vises
   * (`object-contain`) i en 4:5-ramme, som på vanlige produktkort.
   */
  image?: React.ReactNode;
  /** Aksentfarge for bloben bak bildet. */
  accent?: ProductAccent;
  /** Status-merkelapp (Nyhet/Forhåndssalg/Utsolgt) – vises på bildet. */
  badge?: ProductBadge;
  /**
   * Handlings-slot ved siden av lenken, typisk en «Legg i handlekurv»-knapp.
   * Utelates når produktet ikke kan kjøpes rett fra kortet.
   */
  action?: React.ReactNode;
  /** Tekst på lenken til produktsiden. Default "Se produktet". */
  linkLabel?: string;
  className?: string;
}

const badgeToneClass: Record<ProductBadgeTone, string> = {
  new: "bg-accent-1 text-foreground",
  presale: "bg-accent-2 text-foreground",
  soldout: "bg-foreground/80 text-background",
  neutral: "bg-background/90 text-foreground",
};

const blobByAccent: Record<ProductAccent, string> = {
  saffron: "bg-accent-1",
  salmon: "bg-accent-2",
  mint: "bg-accent-3",
};

const accents: ProductAccent[] = ["saffron", "salmon", "mint"];

const blobCorners = [
  "-top-3 -right-3",
  "-top-4 -left-2",
  "-bottom-4 -right-2",
  "-bottom-3 -left-3",
];

function formatPrice(value: number) {
  return `${value.toLocaleString("nb-NO")} kr`;
}

/**
 * Produkt-spotlight: ett produkt presentert liggende, laget for å stå midt i
 * en artikkel eller som en rolig seksjon på en side. Samme visuelle språk som
 * `ProductCard` (nøytral flate, aksent-blob, 4:5-ramme), men bilde og tekst
 * side om side og med plass til en kjøpsknapp. Presentasjons-only — appen
 * kobler inn `next/image` og handlekurv-knappen via slots.
 */
export function ProductSpotlight({
  href,
  name,
  eyebrow,
  description,
  price,
  compareAtPrice,
  priceLabel,
  image,
  accent,
  badge,
  action,
  linkLabel = "Se produktet",
  className,
}: ProductSpotlightProps) {
  const seed = hashSeed(href);
  const resolvedAccent = accent ?? accents[seed % accents.length];
  const discount =
    price != null && compareAtPrice != null && compareAtPrice > price;
  const priceText =
    priceLabel ?? (price != null ? formatPrice(price) : undefined);

  return (
    <Card
      surface="default"
      className={cn("group/spotlight gap-0 overflow-hidden p-0", className)}
    >
      <div className="grid sm:grid-cols-[minmax(0,11rem)_1fr] md:grid-cols-[minmax(0,13rem)_1fr]">
        <div className="relative p-4 sm:pr-0">
          <DecoBlob
            seed={href}
            size={96}
            className={cn(
              "absolute opacity-90 blur-[2px]",
              blobCorners[seed % blobCorners.length],
              blobByAccent[resolvedAccent]
            )}
          />
          <UILink
            href={href}
            aria-label={name}
            className="relative z-10 block aspect-[4/5] overflow-hidden rounded-2xl bg-foreground/[0.04] p-3 transition-transform duration-300 ease-out group-hover/spotlight:-translate-y-0.5 [&_img]:object-contain"
          >
            {image ?? (
              <div className="flex size-full items-center justify-center bg-foreground/5">
                <DecoBlob
                  seed={`${href}-plassholder`}
                  size={56}
                  className="bg-foreground/15 opacity-40"
                />
              </div>
            )}
            {badge && (
              <span
                className={cn(
                  "absolute top-3 left-3 z-20 rounded-full px-3 py-1 font-semibold text-xs shadow-sm backdrop-blur-sm",
                  badgeToneClass[badge.tone ?? "neutral"]
                )}
              >
                {badge.label}
              </span>
            )}
          </UILink>
        </div>

        <div className="flex flex-col gap-2 px-5 pt-2 pb-5 sm:justify-center sm:p-6 md:p-8">
          {eyebrow && (
            <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
              {eyebrow}
            </span>
          )}

          <h3 className="font-bold font-heading text-xl leading-snug tracking-tight md:text-2xl">
            <UILink
              href={href}
              className="transition-colors hover:text-primary"
            >
              {name}
            </UILink>
          </h3>

          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
              {description}
            </p>
          )}

          {priceText && (
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 font-bold text-primary-foreground text-sm">
                {priceText}
              </span>
              {discount && compareAtPrice != null && (
                <span className="text-muted-foreground text-sm line-through">
                  {formatPrice(compareAtPrice)}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {action}
            <UILink
              href={href}
              className="inline-flex items-center gap-1.5 font-medium text-primary text-sm underline-offset-4 hover:underline"
            >
              {linkLabel}
              <span aria-hidden="true">→</span>
            </UILink>
          </div>
        </div>
      </div>
    </Card>
  );
}
