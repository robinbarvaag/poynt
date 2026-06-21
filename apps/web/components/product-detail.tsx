"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import { PRODUCT_TYPE_LABELS, getProductBadge } from "@/lib/product";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { Product } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Heading,
  ProductGrid,
  type ProductGridItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from "@poynt/ui";
import { ArrowRight, Info, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailClientProps {
  product: Product;
  benefits?: string[];
  relatedProducts?: ProductGridItem[];
}

// Status-merkelappens fargetone → Badge-variant på produktsida.
const badgeToneToVariant = {
  new: "saffron",
  presale: "salmon",
  soldout: "muted",
  neutral: "outline",
} as const;

// Medlemskap kjøpes ikkje direkte – det krev ein søknad. Knappen lenkjer til
// søknads-/kontaktsida (styrt av `applyUrl` på produktet, default «/kontakt»).
function MembershipApplyButton({ product }: { product: Product }) {
  const applyUrl = product.applyUrl?.trim() || "/kontakt";

  return (
    <div className="space-y-3">
      <Button asChild size="lg" className="w-full">
        <Link href={applyUrl}>Søk om medlemskap</Link>
      </Button>
      <Text variant="muted" customStyles="text-sm">
        Medlemskapet kan ikke kjøpes direkte – send en kort søknad, så tar vi
        kontakt.
      </Text>
    </div>
  );
}

function ProductDetailClient({
  product,
  benefits = [],
  relatedProducts = [],
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const badge = getProductBadge(product);
  const isSoldOut = product.statusBadge === "soldout";

  // Variant (t.d. signert/usignert) – éin dimensjon per produkt.
  const variantOptions = product.variantOptions ?? [];
  const hasVariants =
    Boolean(product.variantLabel) && variantOptions.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(
    undefined
  );
  const selectedOption = hasVariants
    ? variantOptions.find((o) => o.label === selectedVariant)
    : undefined;
  const priceDelta = selectedOption?.priceDelta ?? 0;
  const effectivePrice = product.price + priceDelta;

  // Antal – kun for produkt som tillèt det (digitale: alltid 1).
  const allowQuantity = Boolean(product.allowQuantity);
  const [quantity, setQuantity] = useState(1);
  const maxQuantity = allowQuantity ? undefined : 1;

  const priceInKr = effectivePrice.toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? product.compareAtPrice.toLocaleString("nb-NO")
    : null;
  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  // Build image array from featuredImage and gallery. Vi beholder hele media-
  // objektet (ikke bare url/alt) så fokuspunkt o.l. flyter til PayloadImage.
  const images: { media: MediaResource; caption?: string }[] = [];
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

  const currentImage = images[selectedImage];

  return (
    <Container padding="default">
      <Breadcrumbs
        items={detailBreadcrumbs("produkter", product.name)}
        className="mb-8"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:items-start lg:gap-16">
        {/* Bildet pinnes mens teksten til høgre scroller forbi – fyller luft
            utan å gøyme brødteksten bak tabs. */}
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="relative">
            {/* Lekent blob-pek bak bildet (INSPO/Steady-signaturen) */}
            <span
              aria-hidden="true"
              className="-top-5 -left-5 absolute size-32 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-saffron opacity-70 blur-[2px]"
            />
            <div className="relative z-10 aspect-square w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
              {currentImage ? (
                <PayloadImage
                  media={currentImage.media}
                  alt={currentImage.media.alt || product.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  <span className="text-6xl">📦</span>
                </div>
              )}

              {hasDiscount && (
                <span className="absolute top-4 right-4 rounded-full bg-saffron px-4 py-1.5 font-semibold text-foreground text-sm shadow-sm">
                  Tilbud
                </span>
              )}
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  type="button"
                  // biome-ignore lint/suspicious/noArrayIndexKey: Using index as key is acceptable here because the list is static and does not change order
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition-colors ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <PayloadImage
                    media={img.media}
                    alt={img.media.alt || `Bilde ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
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

          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <Text
                type="span"
                size="display-md"
                weight="bold"
                color="primary"
                customStyles="leading-none"
              >
                {priceInKr} kr
              </Text>
              {hasDiscount && (
                <Text
                  type="span"
                  variant="muted"
                  customStyles="text-xl line-through"
                >
                  {compareAtPriceInKr} kr
                </Text>
              )}
            </div>
            <Text variant="muted" customStyles="mt-1">
              {product.type === "membership" && product.recurringInterval
                ? product.recurringInterval === 1
                  ? "per månad"
                  : `kvar ${product.recurringInterval}. månad`
                : "Inkl. mva"}
            </Text>
          </div>

          {/* Benefits list */}
          {benefits.length > 0 && (
            <div className="mb-8 rounded-3xl bg-mint p-6 md:p-8">
              <Heading variant="h4" color="foreground" customStyles="mb-4">
                Dette får du:
              </Heading>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li
                    key={`benefit-${benefit}`}
                    className="flex items-start gap-3"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2.5 h-px w-4 shrink-0 rounded-full bg-primary"
                    />
                    <Text customStyles="text-sm">{benefit}</Text>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Forhåndssalg / merknad – lekent callout rett over kjøpsknappen */}
          {product.notice && (
            <div className="flex items-start gap-3 rounded-3xl bg-saffron/30 p-5">
              <span
                aria-hidden="true"
                className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-saffron text-foreground"
              >
                <Info className="size-4" />
              </span>
              <Text customStyles="text-sm leading-relaxed">
                {product.notice}
              </Text>
            </div>
          )}

          <div className="space-y-4 pt-6">
            {/* Variant + antal – kun for kjøpbare produkt som har det */}
            {product.type !== "membership" &&
              !isSoldOut &&
              (hasVariants || allowQuantity) && (
                <div className="space-y-4">
                  {hasVariants && (
                    <div>
                      <Text weight="medium" customStyles="mb-2 text-sm">
                        {product.variantLabel}
                      </Text>
                      <Select
                        value={selectedVariant}
                        onValueChange={setSelectedVariant}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Velg" />
                        </SelectTrigger>
                        <SelectContent>
                          {variantOptions.map((option) => (
                            <SelectItem
                              key={option.id}
                              value={option.label ?? ""}
                            >
                              {option.label}
                              {option.priceDelta
                                ? ` (${option.priceDelta > 0 ? "+" : ""}${option.priceDelta} kr)`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {allowQuantity && (
                    <div>
                      <Text weight="medium" customStyles="mb-2 text-sm">
                        Antal
                      </Text>
                      <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Færre"
                          className="size-9 rounded-full"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="min-w-8 text-center font-medium tabular-nums">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Fleire"
                          className="size-9 rounded-full"
                          onClick={() => setQuantity((q) => q + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {product.type === "membership" ? (
              <MembershipApplyButton product={product} />
            ) : isSoldOut ? (
              <Button size="lg" className="w-full" disabled>
                Utsolgt
              </Button>
            ) : (
              <AddToCartButton
                product={{
                  id: String(product.id),
                  name: product.name,
                  price: effectivePrice,
                  slug: product.slug ?? undefined,
                  image: images[0]
                    ? resolveMediaUrl(images[0].media)
                    : undefined,
                }}
                variantLabel={
                  hasVariants ? (product.variantLabel ?? undefined) : undefined
                }
                variantValue={selectedVariant}
                quantity={quantity}
                maxQuantity={maxQuantity}
                allowQuantity={allowQuantity}
                disabled={hasVariants && !selectedVariant}
                disabledLabel={`Velg ${product.variantLabel ?? "alternativ"}`}
              />
            )}
          </div>

          {/* Salgspunkt – poppast fram rett under kjøpsknappen, ikkje gøymt i
              brødteksten. Dynamisk liste frå produktet (emoji + kort tekst). */}
          {product.highlights && product.highlights.length > 0 && (
            <ul className="mt-5 grid gap-2.5">
              {product.highlights.map((highlight) => (
                <li
                  key={highlight.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  {highlight.icon && (
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-saffron/40 text-lg leading-none"
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
          )}

          {/* Brødtekst flyttar inn i høgre kolonne så han fyller plassen ved
              sida av det sticky bildet i staden for å liggje langt nede. */}
          {product.description && (
            <div className="mt-10 border-t border-border pt-10">
              <Heading variant="h4" color="foreground" customStyles="mb-5">
                Om produktet
              </Heading>
              <div className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground rich-text">
                <RichText data={product.description} />
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
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
      )}
    </Container>
  );
}

export { ProductDetailClient };
