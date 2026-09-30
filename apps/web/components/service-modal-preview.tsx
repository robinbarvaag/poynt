"use client";

import { PayloadImage } from "@/components/payload-image";
import {
  type ServiceShowcaseItem,
  ServiceShowcasePanelBody,
  ShowcaseModal,
} from "@poynt/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getRememberedService,
  markPreviewDismissed,
  markPreviewShown,
  slugFromPathname,
  takeBackPending,
} from "./service-modal-cache";

/** Plassholder for den rike teksten + handlingsknappen som streamer inn. */
function DetailsSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 w-full rounded-full bg-muted" />
        <div className="h-4 w-11/12 rounded-full bg-muted" />
        <div className="h-4 w-4/5 rounded-full bg-muted" />
      </div>
      <div className="mt-8 h-11 w-40 rounded-full bg-muted" />
    </div>
  );
}

/** Plassholder for hele panelet — når kortdataene ikke finnes på klienten. */
function BodySkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-3 w-16 rounded-full bg-muted" />
      <div className="mt-4 h-9 w-3/4 rounded-full bg-muted" />
      <div className="mt-3 h-6 w-32 rounded-full bg-muted" />
      <div className="mt-6">
        <DetailsSkeleton />
      </div>
    </div>
  );
}

function currentSlug(): string | null {
  if (typeof window === "undefined") return null;
  return slugFromPathname(window.location.pathname);
}

/**
 * Suspense-fallback for tjeneste-modalet: viser modal-skallet med kortets
 * data i samme øyeblikk som brukeren klikker, før serveren har svart. Det
 * gir umiddelbar respons (ingen «døde» klikk som frister til å klikke igjen)
 * og dekker samtidig kortene, så et nytt klikk ikke kan starte en
 * konkurrerende navigasjon mens den første laster.
 *
 * Det ekte `ServiceModal` tar over uten ny inn-animasjon (`skipEnter`).
 */
export function ServiceModalPreview() {
  const router = useRouter();
  // Rendres kun ved klient-navigasjon (aldri hydrert fra HTML), så stien kan
  // leses synkront — da får forhåndsvisningen riktig innhold fra første bilde.
  const [slug] = useState(currentSlug);
  const item = slug ? getRememberedService(slug) : undefined;

  useEffect(() => {
    if (slug) markPreviewShown(slug);
  }, [slug]);

  const showcaseItem: ServiceShowcaseItem | null = item
    ? {
        ...item,
        details: <DetailsSkeleton />,
        image: item.image?.url ? (
          <PayloadImage
            media={item.image}
            alt={item.image.alt || item.name}
            fill
            className="object-cover"
          />
        ) : undefined,
      }
    : null;

  return (
    <ShowcaseModal
      ariaLabel={item?.name ?? "Laster tjeneste"}
      image={showcaseItem?.image}
      onCloseStart={() => {
        if (slug) markPreviewDismissed(slug);
      }}
      onClosed={() => {
        // Har `ServiceModal` alt tatt tilbake-steget (innholdet kom midt i
        // exit-animasjonen), skal vi ikke ta det én gang til.
        if (!slug || takeBackPending(slug)) router.back();
      }}
      onDeferredNavigate={(href) => router.push(href, { scroll: false })}
    >
      {showcaseItem ? (
        <ServiceShowcasePanelBody service={showcaseItem} />
      ) : (
        <BodySkeleton />
      )}
    </ShowcaseModal>
  );
}
