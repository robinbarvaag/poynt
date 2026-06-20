"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { type MediaResource, PayloadImage } from "@/components/payload-image";
import type { Product } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Badge, Button, Container, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailClientProps {
  product: Product;
  benefits?: string[];
}

const typeLabels: Record<string, string> = {
  product: "Produkt",
  course: "Kurs",
  pdf: "PDF",
  bundle: "Bundle",
  membership: "Medlemskap",
};

function MembershipCheckoutButton({ product }: { product: Product }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: String(product.id), quantity: 1 }],
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Noko gjekk gale");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Noko gjekk gale ved checkout"
      );
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        size="lg"
        className="w-full"
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? "Laster..." : "Bli medlem"}
      </Button>
      {error && (
        <Text color="danger" customStyles="mt-2 text-sm">
          {error}
        </Text>
      )}
    </div>
  );
}

function ProductDetailClient({
  product,
  benefits = [],
}: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const priceInKr = product.price.toLocaleString("nb-NO");
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
      {/* Back link */}
      <Link
        href="/produkter"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Alle produkter</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
        <div className="space-y-4">
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
          <div className="mb-4">
            <Badge variant="soft-saffron" size="lg">
              {typeLabels[product.type] || product.type}
            </Badge>
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

          <div className="mt-auto pt-4">
            {product.type === "membership" ? (
              <MembershipCheckoutButton product={product} />
            ) : (
              <AddToCartButton
                product={{
                  id: String(product.id),
                  name: product.name,
                  price: product.price,
                  slug: product.slug ?? undefined,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {product.description && (
        <div className="mt-16 pt-16 border-t border-border">
          <Heading size="h2" color="foreground" customStyles="mb-6">
            Om produktet
          </Heading>
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground rich-text">
            <RichText data={product.description} />
          </div>
        </div>
      )}
    </Container>
  );
}

export { ProductDetailClient };
