import { AddToCartButton } from "@/components/add-to-cart-button";
import { PayloadImage, resolveMediaUrl } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import { PRODUCT_TYPE_LABELS, getProductBadge } from "@/lib/product";
import type { Product } from "@/payload-types";
import config from "@/payload.config";
import { ProductSpotlight } from "@poynt/ui";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

type ProductRef = number | string | Product;

export interface ProductSpotlightCardProps {
  /** Relasjonen fra Payload — id eller ferdig populert dokument. */
  product: ProductRef | null | undefined;
  eyebrow?: string | null;
  text?: string | null;
  showAddToCart?: boolean | null;
  className?: string;
}

/** Cachet oppslag når relasjonen kom som ren id (f.eks. lav `depth`). */
async function fetchProduct(id: number): Promise<Product | null> {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    where: { id: { equals: id }, active: { equals: true } },
    depth: 1,
    limit: 1,
  });
  return result.docs[0] ?? null;
}

async function resolveProduct(ref: ProductRef | null | undefined) {
  if (ref == null) return null;
  if (typeof ref === "object") return ref.active ? ref : null;
  const id = typeof ref === "string" ? Number(ref) : ref;
  return Number.isFinite(id) ? fetchProduct(id) : null;
}

/**
 * «Produktkort»-blokken koblet til Payload: henter produktet, bygger bilde,
 * merkelapp og pris med samme regler som produktkortene, og legger på en
 * «Legg i handlekurv»-knapp der kjøpet kan skje rett fra kortet. Produkter
 * med varianter, medlemskap og utsolgte produkter sendes til produktsiden.
 */
export async function ProductSpotlightCard({
  product: ref,
  eyebrow,
  text,
  showAddToCart = true,
  className,
}: ProductSpotlightCardProps) {
  const product = await resolveProduct(ref);
  if (!product) return null;

  const media = resolveMedia(product.featuredImage);
  const href = `/produkter/${product.slug}`;

  const hasVariants =
    Boolean(product.variantLabel) && (product.variantOptions?.length ?? 0) > 0;
  const purchasable =
    Boolean(showAddToCart) &&
    product.type !== "membership" &&
    product.statusBadge !== "soldout" &&
    !hasVariants;

  return (
    <ProductSpotlight
      href={href}
      name={product.name}
      eyebrow={
        eyebrow?.trim() || (PRODUCT_TYPE_LABELS[product.type] ?? product.type)
      }
      description={text?.trim() || product.shortDescription || undefined}
      price={product.price}
      compareAtPrice={product.compareAtPrice ?? undefined}
      badge={getProductBadge(product)}
      linkLabel={
        product.type === "membership" ? "Les om medlemskapet" : "Se produktet"
      }
      image={
        media?.url ? (
          <PayloadImage
            media={media}
            alt={media.alt || product.name}
            fill
            sizes="(min-width: 768px) 13rem, (min-width: 640px) 11rem, 100vw"
            className="object-contain"
          />
        ) : undefined
      }
      action={
        purchasable ? (
          <AddToCartButton
            product={{
              id: String(product.id),
              name: product.name,
              price: product.price,
              slug: product.slug,
              image: resolveMediaUrl(media),
            }}
            allowQuantity={Boolean(product.allowQuantity)}
            maxQuantity={product.allowQuantity ? undefined : 1}
            className="sm:w-auto"
          />
        ) : undefined
      }
      className={className}
    />
  );
}
