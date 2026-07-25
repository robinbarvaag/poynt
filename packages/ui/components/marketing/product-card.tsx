import type * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export type ProductSurface = "default" | "saffron" | "salmon" | "mint";

export type ProductBadgeTone = "new" | "presale" | "soldout" | "neutral";

export interface ProductBadge {
  /** Teksten på merkelappen, f.eks. "Forhåndssalg". */
  label: string;
  /** Fargetone — styrer pill-fargen. Default "neutral". */
  tone?: ProductBadgeTone;
}

export interface ProductCardProps {
  /** Lenke til produktsiden. Hele kortet er klikkbart. */
  href: string;
  name: string;
  /** Liten kategori-/type-ledetekst, f.eks. "Kurs". */
  eyebrow?: string;
  shortDescription?: string;
  /** Pris i kr. Formateres som norsk tall + " kr". */
  price?: number;
  /** Før-pris (gjennomstreket når den er høyere enn `price`). */
  compareAtPrice?: number;
  /** Overstyr prisvisningen helt, f.eks. "Gratis" eller "Fra 99 kr". */
  priceLabel?: string;
  /**
   * Media-slot — send f.eks. et `next/image` med `fill className="object-cover"`.
   * Uten media vises en dempet plassholder.
   */
  image?: React.ReactNode;
  /** Fargeblokk-tint. `default` er det lyse kortet. */
  surface?: ProductSurface;
  /** Stort, fremhevet kort: bilde og innhold side-om-side (spenn 2 kolonner). */
  featured?: boolean;
  /** Status-merkelapp (Nyhet/Forhåndssalg/Utsolgt) – vises øverst til venstre. */
  badge?: ProductBadge;
  className?: string;
}

// Fargetone → pill-stil for status-merkelappen.
const badgeToneClass: Record<ProductBadgeTone, string> = {
  new: "bg-accent-1 text-foreground",
  presale: "bg-accent-2 text-foreground",
  soldout: "bg-foreground/80 text-background",
  neutral: "bg-background/90 text-foreground",
};

// Pris-pill: grønn primær-flate gir god kontrast på alle surfaces vi bruker.
const pricePill = "bg-primary text-primary-foreground";

const blobBySurface: Record<ProductSurface, string> = {
  default: "bg-accent-1",
  saffron: "bg-accent-2",
  salmon: "bg-accent-1",
  mint: "bg-accent-2",
};

// Organisk blob-form (asymmetrisk border-radius) — INSPO/Steady-signaturen.
const blobShape = "rounded-[58%_42%_55%_45%/55%_48%_52%_45%]";

function formatPrice(value: number) {
  return `${value.toLocaleString("nb-NO")} kr`;
}

function ImageFrame({
  image,
  surface,
  featured,
  discount,
  badge,
}: {
  image?: React.ReactNode;
  surface: ProductSurface;
  featured?: boolean;
  discount?: boolean;
  badge?: ProductBadge;
}) {
  return (
    <div className={cn("relative p-3", featured && "md:h-full")}>
      {/* Lekent blob-pek bak bildet */}
      <span
        aria-hidden="true"
        className={cn(
          "-top-3 -right-3 absolute size-24 opacity-70 blur-[2px]",
          blobShape,
          blobBySurface[surface]
        )}
      />
      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-2xl bg-background/50",
          featured
            ? "aspect-4/3 md:aspect-auto md:h-full md:min-h-72"
            : "aspect-4/3"
        )}
      >
        {image ?? (
          <div className="flex size-full items-center justify-center bg-foreground/5">
            <span
              aria-hidden="true"
              className={cn(
                "size-16 opacity-40",
                blobShape,
                "bg-foreground/15"
              )}
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
        {discount && (
          <span className="absolute top-3 right-3 z-20 rounded-full bg-accent-1 px-3 py-1 font-semibold text-foreground text-xs shadow-sm">
            Tilbud
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductCard({
  href,
  name,
  eyebrow,
  shortDescription,
  price,
  compareAtPrice,
  priceLabel,
  image,
  surface = "default",
  featured = false,
  badge,
  className,
}: ProductCardProps) {
  const discount =
    price != null && compareAtPrice != null && compareAtPrice > price;
  const priceText =
    priceLabel ?? (price != null ? formatPrice(price) : undefined);

  return (
    <Card
      asChild
      surface={surface}
      className={cn(
        "group/product gap-0 overflow-hidden p-0 hover:-translate-y-1.5",
        featured && "sm:col-span-2",
        className
      )}
    >
      <a href={href}>
        <div
          className={cn(
            featured &&
              "md:grid md:h-full md:grid-cols-2 md:items-stretch md:gap-6"
          )}
        >
          <ImageFrame
            image={image}
            surface={surface}
            featured={featured}
            discount={discount}
            badge={badge}
          />

          <div
            className={cn(
              "flex flex-col gap-2 px-5 pt-3 pb-5",
              featured && "md:py-10 md:pr-8 md:pl-0"
            )}
          >
            {eyebrow && (
              <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
                {eyebrow}
              </span>
            )}

            <h3
              className={cn(
                "font-bold font-heading leading-snug tracking-tight transition-colors",
                featured ? "text-2xl md:text-3xl" : "line-clamp-2 text-lg"
              )}
            >
              {name}
            </h3>

            {shortDescription && (
              <p
                className={cn(
                  "text-current/70 text-sm leading-relaxed",
                  featured ? "line-clamp-3" : "line-clamp-2"
                )}
              >
                {shortDescription}
              </p>
            )}

            {priceText && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-2",
                  featured && "md:mt-auto md:pt-6"
                )}
              >
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-3.5 py-1.5 font-bold text-sm",
                    pricePill
                  )}
                >
                  {priceText}
                </span>
                {discount && compareAtPrice != null && (
                  <span className="text-current/60 text-sm line-through">
                    {formatPrice(compareAtPrice)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </a>
    </Card>
  );
}
