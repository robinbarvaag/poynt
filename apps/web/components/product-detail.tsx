"use client";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getMediaUrl } from "@/lib/media-url";
import { Product } from "@/payload-types";
import { Badge, Container, Heading } from "@poynt/ui";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeft, Check } from "lucide-react";
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
};

function ProductDetailClient({ product, benefits = [] }: ProductDetailClientProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const priceInKr = (product.price / 100).toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? (product.compareAtPrice / 100).toLocaleString("nb-NO")
    : null;
  const hasDiscount = compareAtPriceInKr && product.compareAtPrice! > product.price;

  // Build image array from featuredImage and gallery
  const images: { url: string; alt?: string; caption?: string }[] = [];
  if (product.featuredImage && typeof product.featuredImage !== "number") {
    images.push({
      url: product.featuredImage.url!,
      alt: product.featuredImage.alt ?? undefined,
    });
  }
  if (product.gallery) {
    product.gallery.forEach((item) => {
      if (item.image && typeof item.image !== "number") {
        images.push({
          url: item.image.url!,
          alt: item.image.alt ?? undefined,
          caption: item.caption ?? undefined,
        });
      }
    });
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
        {/* Image gallery */}
        <div className="space-y-4">
          {/* Main image */}
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

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-4 right-4">
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  Tilbud
                </Badge>
              </div>
            )}
          </div>

          {/* Thumbnail gallery */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
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

        {/* Product info */}
        <div className="flex flex-col">
          {/* Type badge */}
          <div className="mb-4">
            <Badge variant="secondary">
              {typeLabels[product.type] || product.type}
            </Badge>
          </div>

          {/* Title */}
          <Heading size="h1" className="mb-4">{product.name}</Heading>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-lg text-muted-foreground mb-6">
              {product.shortDescription}
            </p>
          )}

          {/* Price */}
          <div className="mb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-primary">{priceInKr} kr</span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  {compareAtPriceInKr} kr
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Inkl. mva</p>
          </div>

          {/* Benefits list */}
          {benefits.length > 0 && (
            <div className="mb-8 p-5 bg-muted/50 rounded-xl border border-border/50">
              <h3 className="font-semibold mb-4 text-lg">Dette får du:</h3>
              <ul className="space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-auto pt-4">
            <AddToCartButton product={product as any} />
          </div>
        </div>
      </div>

      {/* Description section */}
      {product.description && (
        <div className="mt-16 pt-16 border-t border-border">
          <Heading size="h2" className="mb-6">Om produktet</Heading>
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground rich-text">
            <RichText data={product.description} />
          </div>
        </div>
      )}
    </Container>
  );
}

export { ProductDetailClient };
