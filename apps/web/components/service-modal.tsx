"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  type ServiceShowcaseItem,
  type ServiceShowcaseLinkProps,
  ServiceShowcaseModal,
} from "@poynt/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  consumePreviewState,
  slugFromPathname,
  takeBackPending,
} from "./service-modal-cache";

/** CTA-lenke i panelet → klientnavigasjon som trigger kontaktmodalet. */
function CtaLink(props: ServiceShowcaseLinkProps) {
  return <Link {...props} />;
}

export interface ServiceModalData {
  id: string | number;
  name: string;
  price?: string;
  description: string;
  eyebrow?: string;
  /** Rene media-data (serialiserbart) — url/alt/fokuspunkt. */
  image?: MediaResource;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Tjenestemodalet vist via @modal/(.)tjenester-interceptoren. Når
 * exit-animasjonen er ferdig går vi ett steg tilbake i historikken, så
 * brukeren havner på siden modalet ble åpnet fra.
 *
 * Tar over etter `ServiceModalPreview` (Suspense-fallbacken) uten ny
 * inn-animasjon, og nekter å vise innhold som ikke matcher slug-en i URL-en.
 * Det siste er en sikring: Next holder skjulte rute-instanser i live
 * (`<Activity>`), og skulle en gammel instans bli vist for feil adresse, er
 * «ingenting» bedre enn feil tjeneste. Avviket logges med `[tjeneste-modal]`.
 */
export function ServiceModal({
  service,
  slug,
  details,
}: {
  service: ServiceModalData;
  /** Slug-en innholdet tilhører — sammenlignes med URL-en. */
  slug: string;
  details?: React.ReactNode;
}) {
  const router = useRouter();
  // Én gang per montering: sto forhåndsvisningen alt på skjermen, eller ble
  // den lukket før vi rakk fram?
  const [preview] = useState(() => consumePreviewState(slug));
  // Lukket brukeren forhåndsvisningen, skal ikke innholdet sprette opp igjen.
  const [hidden, setHidden] = useState(preview.dismissed);
  const [mismatch, setMismatch] = useState(false);

  // Kjøres også hver gang Activity viser ruten igjen.
  useEffect(() => {
    const urlSlug = slugFromPathname(window.location.pathname);
    const bad = urlSlug !== null && urlSlug !== slug;
    if (bad) {
      console.warn(
        `[tjeneste-modal] URL-en sier «${urlSlug}», innholdet er «${slug}» — skjuler modalet.`
      );
    }
    setMismatch(bad);
  }, [slug]);

  useEffect(() => {
    if (!hidden) return;
    // Er tilbake-steget ennå ikke tatt (forhåndsvisningen rakk ikke fullføre
    // exit-animasjonen før vi tok over), tar vi det — og viser modalet neste
    // gang ruten vises (opprydderen kjøres når Activity skjuler den).
    if (takeBackPending(slug)) {
      router.back();
      return () => setHidden(false);
    }
    // Tilbake-steget er alt tatt, og ruten vises på nytt: brukeren åpnet
    // tjenesten igjen med vilje.
    setHidden(false);
  }, [hidden, slug, router]);

  if (mismatch || hidden) {
    return null;
  }

  const item: ServiceShowcaseItem = {
    ...service,
    details: details ? (
      // Rik tekst kommer etter forhåndsvisningen — la den gli inn i stedet
      // for å blinke. `starting:` = CSS @starting-style, ren CSS-overgang.
      <div className="transition-opacity duration-200 ease-out starting:opacity-0">
        {details}
      </div>
    ) : undefined,
    image: service.image?.url ? (
      <PayloadImage
        media={service.image}
        alt={service.image.alt || service.name}
        fill
        className="object-cover"
      />
    ) : undefined,
  };

  return (
    <ServiceShowcaseModal
      service={item}
      onClosed={() => router.back()}
      onDeferredNavigate={(href) => router.push(href, { scroll: false })}
      ctaLinkComponent={CtaLink}
      skipEnter={preview.shown && !preview.dismissed}
    />
  );
}
