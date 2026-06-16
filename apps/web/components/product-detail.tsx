"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getMediaUrl } from "@/lib/media-url";
import type { Product } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Badge, Button, Container, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface ProductDetailClientProps {
  product: Product;
  benefits?: string[];
}

const typeLabels: Record<string, string> = {
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

  // Build image array from featuredImage and gallery
  const images: { url: string; alt?: string; caption?: string }[] = [];
  if (
    product.featuredImage &&
    typeof product.featuredImage !== "number" &&
    product.featuredImage.url
  ) {
    images.push({
      url: product.featuredImage.url,
      alt: product.featuredImage.alt ?? undefined,
    });
  }
  if (product.gallery) {
    for (const item of product.gallery) {
      if (item.image && typeof item.image !== "number" && item.image.url) {
        images.push({
          url: item.image.url,
          alt: item.image.alt ?? undefined,
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
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted">
            {currentImage ? (
              <Image
                src={getMediaUrl(currentImage.url)}
                alt={currentImage.alt || product.name}
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
              <span className="absolute top-4 right-4 rounded-full bg-saffron px-4 py-1.5 font-semibold text-foreground text-sm">
                Tilbud
              </span>
            )}
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
                  <Image
                    src={getMediaUrl(img.url)}
                    alt={img.alt || `Bilde ${index + 1}`}
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
            <Badge variant="secondary">
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
            <div className="mb-8 rounded-2xl border border-border/50 bg-muted/50 p-6">
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
