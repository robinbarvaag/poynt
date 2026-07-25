"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import { ProductStorySections } from "@/components/product/product-story-sections";
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
  Lightbox,
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
  relatedProducts?: ProductGridItem[];
}

// Status-merkelappens fargetone → Badge-variant på produktsiden.
const badgeToneToVariant = {
  new: "saffron",
  presale: "salmon",
  soldout: "muted",
  neutral: "outline",
} as const;

// Medlemskap kjøpes ikke direkte – det krever en søknad. Knappen lenker til
// søknads-/kontaktsiden (styrt av `applyUrl` på produktet, default «/kontakt»).
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
  relatedProducts = [],
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const badge = getProductBadge(product);
  const isSoldOut = product.statusBadge === "soldout";

  // Variant (f.eks. signert/usignert) – én dimensjon per produkt.
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

  // Antall – kun for produkter som tillater det (digitale: alltid 1).
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
        {/* Bildet pinnes mens teksten til høyre scroller forbi – fyller luft
            uten å gjemme brødteksten bak tabs. */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="relative">
            {/* Lekent blob-pek bak bildet (INSPO/Steady-signaturen) */}
            <span
              aria-hidden="true"
              className="-top-5 -left-5 absolute size-32 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-accent-1 opacity-70 blur-[2px]"
            />
            <div className="relative z-10 aspect-square w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
              {currentImage ? (
                <Lightbox
                  src={resolveMediaUrl(currentImage.media)}
                  alt={currentImage.media.alt || product.name}
                  caption={currentImage.caption}
                  tone="salmon"
                  className="h-full"
                >
                  <PayloadImage
                    media={currentImage.media}
                    alt={currentImage.media.alt || product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                </Lightbox>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                  <span className="text-6xl">📦</span>
                </div>
              )}

              {hasDiscount && (
                <span className="absolute top-4 right-4 rounded-full bg-accent-1 px-4 py-1.5 font-semibold text-foreground text-sm shadow-sm">
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
                  ? "per måned"
                  : `hver ${product.recurringInterval}. måned`
                : "Inkl. mva"}
            </Text>
          </div>

          {/* Forhåndssalg / merknad – oppmerksomhets-callout (accent-5/saffron)
              rett over kjøpsknappen: ikon + tittel på én linje, teksten under. */}
          {product.notice && (
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
          )}

          <div className="space-y-4 pt-6">
            {/* Variant + antall – kun for kjøpbare produkter som har det */}
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
                        Antall
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
                          aria-label="Flere"
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

          {/* Salgspunkter – løftes frem rett under kjøpsknappen, ikke gjemt i
              brødteksten. Dynamisk liste fra produktet (emoji + kort tekst). */}
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
          )}

          {/* Brødteksten ligger i høyre kolonne så den fyller plassen ved
              siden av det sticky bildet i stedet for å ligge langt nede. */}
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

      {/* Datadrevne «historie»-seksjoner: mellomlang beskrivelse, bakside,
          lesersitater, PDF-smakebit og video. Vises i full bredde under den
          delte topp-seksjonen – felles for alle produkttyper. */}
      <ProductStorySections product={product} />

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
