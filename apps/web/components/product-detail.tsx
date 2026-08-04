import { resolveMediaUrl } from "@/components/payload-image";
import {
  ProductDetailInteractive,
  type ProductVariantOption,
} from "@/components/product/product-detail-interactive";
import {
  type ProductDetailImage,
  ProductGallery,
} from "@/components/product/product-gallery";
import { ProductStorySections } from "@/components/product/product-story-sections";
import { PRODUCT_TYPE_LABELS, getProductBadge } from "@/lib/product";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Product } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Heading,
  ProductGrid,
  type ProductGridItem,
  Text,
} from "@poynt/ui";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";

interface ProductDetailProps {
  product: Product;
  relatedProducts?: ProductGridItem[];
}

// Status-merkelappens fargetone → Badge-variant på produktsiden.
const badgeToneToVariant = {
  new: "saffron",
  presale: "salmon",
  soldout: "muted",
  neutral: "outline",
} as const;

/**
 * Produktsiden – server-komponent. Alt statisk innhold (brødsmuler, badges,
 * overskrift, rik tekst, salgspunkter, historie-seksjoner, relaterte
 * produkter) rendres her og sendes som ferdig JSX inn i klient-skallet
 * `ProductDetailInteractive`, som kun får de minimale serialiserbare feltene
 * kjøpsflyten trenger – ikke hele Payload-dokumentet.
 */
function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const badge = getProductBadge(product);
  const isSoldOut = product.statusBadge === "soldout";

  // Minimal, serialiserbar delmengde av variantvalgene til klienten.
  const variantOptions: ProductVariantOption[] = (
    product.variantOptions ?? []
  ).map((option) => ({
    id: option.id,
    label: option.label,
    priceDelta: option.priceDelta,
  }));

  const compareAtPriceInKr = product.compareAtPrice
    ? product.compareAtPrice.toLocaleString("nb-NO")
    : null;
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  // Teksten under prisen avhenger ikke av variantvalget – regnes ut her så
  // klienten slipper å kjenne til abonnementsfeltene.
  const priceSuffix =
    product.type === "membership" && product.recurringInterval
      ? product.recurringInterval === 1
        ? "per måned"
        : `hver ${product.recurringInterval}. måned`
      : "Inkl. mva";

  // Build image array from featuredImage and gallery. Vi beholder hele media-
  // objektet (ikke bare url/alt) så fokuspunkt o.l. flyter til PayloadImage.
  const images: ProductDetailImage[] = [];
  if (
    product.featuredImage &&
    typeof product.featuredImage !== "number" &&
    product.featuredImage.url
  ) {
    images.push({ media: product.featuredImage });
  }
  if (product.gallery) {
    for (const item of product.gallery) {
      if (item.image && typeof item.image !== "number" && item.image.url) {
        images.push({
          media: item.image,
          caption: item.caption ?? undefined,
        });
      }
    }
  }

  // ProductStorySections er en klientkomponent (pdf.js/video trenger
  // nettleseren) som tar hele produktet som prop. Vi nuller ut de tunge
  // feltene den ikke leser (rik tekst, galleri, bilder) så de ikke
  // serialiseres til klienten en gang til via denne grensen.
  const storyProduct: Product = {
    ...product,
    description: null,
    gallery: null,
    featuredImage: null,
    pdfFile: null,
    meta: {},
  };

  return (
    <ProductDetailInteractive
      info={{
        id: String(product.id),
        name: product.name,
        slug: product.slug,
        type: product.type,
        price: product.price,
        isSoldOut,
        allowQuantity: Boolean(product.allowQuantity),
        variantLabel: product.variantLabel ?? undefined,
        variantOptions,
        applyUrl: product.applyUrl ?? undefined,
        hasDiscount,
        compareAtPriceInKr,
        priceSuffix,
      }}
      cartImageUrl={images[0] ? resolveMediaUrl(images[0].media) : undefined}
      stickyMedia={images[0]?.media}
      breadcrumbs={
        <Breadcrumbs
          items={detailBreadcrumbs("produkter", product.name)}
          className="mb-8"
        />
      }
      gallery={
        <ProductGallery
          images={images}
          productName={product.name}
          seed={`/produkter/${product.slug}`}
          hasDiscount={hasDiscount}
        />
      }
      header={
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="soft-saffron" size="lg">
              {PRODUCT_TYPE_LABELS[product.type] || product.type}
            </Badge>
            {badge && (
              <Badge
                variant={badgeToneToVariant[badge.tone ?? "neutral"]}
                size="lg"
              >
                {badge.label}
              </Badge>
            )}
          </div>

          <Heading
            size="h1"
            color="foreground"
            weight="bold"
            customStyles="mb-4"
          >
            {product.name}
          </Heading>

          {product.shortDescription && (
            <Text variant="lead" customStyles="mb-6">
              {product.shortDescription}
            </Text>
          )}
        </>
      }
      notice={
        /* Forhåndssalg / merknad – oppmerksomhets-callout (accent-5/saffron)
           rett over kjøpsknappen: ikon + tittel på én linje, teksten under. */
        product.notice ? (
          <div className="rounded-3xl bg-accent-5/20 p-5">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-5 text-accent-5-foreground"
              >
                <Info className="size-4" />
              </span>
              <Text weight="semibold" customStyles="text-sm">
                {product.noticeTitle || "Godt å vite"}
              </Text>
            </div>
            <Text customStyles="mt-2 pl-10 text-sm leading-relaxed">
              {product.notice}
            </Text>
          </div>
        ) : null
      }
      highlights={
        /* Salgspunkter – løftes frem rett under kjøpsknappen, ikke gjemt i
           brødteksten. Dynamisk liste fra produktet (emoji + kort tekst). */
        product.highlights && product.highlights.length > 0 ? (
          <ul className="mt-5 grid gap-2.5">
            {product.highlights.map((highlight) => (
              <li
                key={highlight.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                {highlight.icon && (
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-1/40 text-lg leading-none"
                  >
                    {highlight.icon}
                  </span>
                )}
                <Text weight="medium" customStyles="text-sm leading-snug">
                  {highlight.text}
                </Text>
              </li>
            ))}
          </ul>
        ) : null
      }
      description={
        /* Brødteksten ligger i høyre kolonne så den fyller plassen ved
           siden av det sticky bildet i stedet for å ligge langt nede. */
        product.description ? (
          <div className="mt-10 border-t border-border pt-10">
            <Heading variant="h4" color="foreground" customStyles="mb-5">
              Om produktet
            </Heading>
            <div className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground rich-text">
              <RichText data={product.description} />
            </div>
          </div>
        ) : null
      }
      storySections={
        /* Datadrevne «historie»-seksjoner: mellomlang beskrivelse, bakside,
           lesersitater, PDF-smakebit og video. Vises i full bredde under den
           delte topp-seksjonen – felles for alle produkttyper. */
        <ProductStorySections product={storyProduct} />
      }
      related={
        relatedProducts.length > 0 ? (
          <div className="mt-16 pt-16 border-t border-border">
            <div className="mb-8 flex items-center justify-between gap-4">
              <Heading size="h2" color="foreground">
                Andre produkter
              </Heading>
              <Link
                href="/produkter"
                className="inline-flex shrink-0 items-center gap-2 font-medium text-primary hover:underline"
              >
                Se alle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ProductGrid products={relatedProducts} featureFirst={false} />
          </div>
        ) : null
      }
    />
  );
}

export { ProductDetail };
