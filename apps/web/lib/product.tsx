import { PayloadImage } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import type { Product } from "@/payload-types";
import type { ProductBadge, ProductGridItem } from "@poynt/ui";

/** Produkttype → norsk etikett (eyebrow på kort/sider). Én kilde for alle. */
export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  product: "Produkt",
  course: "Kurs",
  pdf: "PDF",
  bundle: "Pakke",
  membership: "Medlemskap",
};

/** Filtervalg for produktoversikten (delmengde av typene, i visningsrekkefølge). */
export const PRODUCT_TYPE_FILTERS: { value: string; label: string }[] = [
  { value: "product", label: "Produkter" },
  { value: "course", label: "Kurs" },
  { value: "pdf", label: "PDF" },
  { value: "bundle", label: "Pakker" },
];

const STATUS_BADGES: Record<
  Exclude<NonNullable<Product["statusBadge"]>, "none" | "custom">,
  ProductBadge
> = {
  new: { label: "Nyhet", tone: "new" },
  presale: { label: "Forhåndssalg", tone: "presale" },
  soldout: { label: "Utsolgt", tone: "soldout" },
};

/**
 * Mapper produktets `statusBadge`-felt til ein ferdig merkelapp som både
 * produktkort og produktsida kan rendre. Returnerer `undefined` når produktet
 * ikkje har nokon status (slik at kortet/sida berre droppar merkelappen).
 */
export function getProductBadge(product: Product): ProductBadge | undefined {
  const status = product.statusBadge;
  if (!status || status === "none") return undefined;

  if (status === "custom") {
    const label = product.statusBadgeLabel?.trim();
    return label ? { label, tone: "neutral" } : undefined;
  }

  return STATUS_BADGES[status];
}

/**
 * Gjør eit Payload-produkt om til kortdataene `ProductGrid` treng. Felles for
 * produktoversikt, produkt-arkivblokk og «Andre produkter» på produktsida, slik
 * at merkelapp, bilde og pris ser likt ut overalt.
 */
export function toProductGridItem(product: Product): ProductGridItem {
  const media = resolveMedia(product.featuredImage);

  return {
    id: product.id,
    href: `/produkter/${product.slug}`,
    name: product.name,
    eyebrow: PRODUCT_TYPE_LABELS[product.type] ?? product.type,
    shortDescription: product.shortDescription ?? undefined,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? undefined,
    badge: getProductBadge(product),
    image: media?.url ? (
      <PayloadImage
        media={media}
        alt={media.alt || product.name}
        fill
        className="object-cover"
      />
    ) : undefined,
  };
}
