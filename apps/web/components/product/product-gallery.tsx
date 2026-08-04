"use client";
import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import { DecoBlob, Lightbox, hashSeed } from "@poynt/ui";
import { useState } from "react";

/** Ett produktbilde med valgfri bildetekst (hovedbilde + galleri). */
export interface ProductDetailImage {
  media: MediaResource;
  caption?: string;
}

interface ProductGalleryProps {
  images: ProductDetailImage[];
  productName: string;
  /** Seed for DecoBlob – samme som produktkortet (`/produkter/<slug>`). */
  seed: string;
  hasDiscount: boolean;
}

/**
 * Bildegalleriet på produktsiden – klientkomponent fordi valgt bilde er
 * lokal state. Får kun bildelista (media + bildetekst), ikke hele produktet.
 */
function ProductGallery({
  images,
  productName,
  seed,
  hasDiscount,
}: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const currentImage = images[selectedImage];

  return (
    /* Bildet pinnes mens teksten til høyre scroller forbi – fyller luft
       uten å gjemme brødteksten bak tabs. */
    <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="relative">
        {/* Lekent blob-pek bak bildet (INSPO/Steady-signaturen) —
            form/hjørne varierer per produkt, samme seed som kortet */}
        <DecoBlob
          seed={seed}
          size={132}
          className={`absolute bg-accent-1 opacity-70 blur-[2px] ${
            hashSeed(seed) % 2 === 0 ? "-top-5 -left-5" : "-top-4 -right-5"
          }`}
        />
        <div className="relative z-10 aspect-square w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
          {currentImage ? (
            <Lightbox
              src={resolveMediaUrl(currentImage.media)}
              alt={currentImage.media.alt || productName}
              caption={currentImage.caption}
              tone="salmon"
              className="h-full"
            >
              <PayloadImage
                media={currentImage.media}
                alt={currentImage.media.alt || productName}
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
  );
}

export { ProductGallery };
