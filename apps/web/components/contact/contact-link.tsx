"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

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
  const pathname = usePathname();

  const params = new URLSearchParams();
  params.set("kilde", kilde);
  if (emne) params.set("emne", emne);
  if (pathname) params.set("fra", pathname);

  return (
    <Link ref={ref} href={`${href}?${params.toString()}`} {...rest}>
      {children}
    </Link>
  );
});
ContactLink.displayName = "ContactLink";
