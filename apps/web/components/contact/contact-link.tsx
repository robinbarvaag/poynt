"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Suspense } from "react";

export interface ContactLinkProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> {
  /**
   * Lesbar kilde-etikett som lagres på innsendingen, f.eks. "header",
   * "tjeneste:radgivning" eller "cta:forside-bunn". Lar oss se hvor en
   * henvendelse faktisk ble sendt fra.
   */
  kilde: string;
  /** Forhåndsvelger «Hva gjelder det?» i skjemaet (matcher en av valgene). */
  emne?: string;
  /** Overstyr mål-siden (standard /kontakt). Beholder modal-interceptoren. */
  href?: string;
}

/**
 * Lenke til kontaktskjemaet som stemples med kilde + sti. Ved klikk
 * (klient-navigasjon) fanger Next.js intercepting-route den opp og åpner
 * skjemaet i et modal; ved refresh/direktelenke vises hele /kontakt-siden.
 * Spør `usePathname()` for å feste «fra»-stien der brukeren faktisk sto.
 */
export const ContactLink = React.forwardRef<
  HTMLAnchorElement,
  ContactLinkProps
>(({ kilde, emne, href = "/kontakt", children, ...rest }, ref) => {
  const buildHref = (pathname: string | null) => {
    const params = new URLSearchParams();
    params.set("kilde", kilde);
    if (emne) params.set("emne", emne);
    if (pathname) params.set("fra", pathname);
    return `${href}?${params.toString()}`;
  };

  // usePathname er runtime-data under prerendering (cacheComponents) — les den
  // bak en Suspense-grense. Fallbacket er samme lenke uten «fra»-stempel, så
  // skallet er komplett mens stien streamer inn.
  return (
    <Suspense
      fallback={
        <Link ref={ref} href={buildHref(null)} {...rest}>
          {children}
        </Link>
      }
    >
      <PathStampedLink ref={ref} buildHref={buildHref} {...rest}>
        {children}
      </PathStampedLink>
    </Suspense>
  );
});
ContactLink.displayName = "ContactLink";

const PathStampedLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & {
    buildHref: (pathname: string | null) => string;
  }
>(({ buildHref, children, ...rest }, ref) => {
  const pathname = usePathname();
  return (
    <Link ref={ref} href={buildHref(pathname)} {...rest}>
      {children}
    </Link>
  );
});
PathStampedLink.displayName = "PathStampedLink";
