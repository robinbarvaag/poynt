"use client";

import { isInterceptedHref } from "@/lib/intercepted-routes";
import { LinkComponentProvider, type UILinkProps } from "@poynt/ui";
import Link from "next/link";
import * as React from "react";

/**
 * Lenkekomponenten designsystemet (@poynt/ui) bruker for interne lenker.
 * Uten denne rendrer kortene i @poynt/ui vanlige `<a>`-tagger, som gir full
 * sidelast på hvert klikk — altså ingen instant navigation.
 *
 * Lenker til modal-ruter (/kontakt, /tjenester/[slug]) skal ikke scrolle siden
 * bak til toppen; alt annet får Next sin vanlige scroll-til-toppen.
 */
const NextUILink = React.forwardRef<HTMLAnchorElement, UILinkProps>(
  function NextUILink({ href, ...rest }, ref) {
    return (
      <Link
        ref={ref}
        href={href}
        scroll={isInterceptedHref(href) ? false : undefined}
        {...rest}
      />
    );
  }
);

/** Kobler @poynt/ui sine interne lenker til next/link (klient-navigasjon). */
export function UILinkProvider({ children }: { children: React.ReactNode }) {
  return (
    <LinkComponentProvider component={NextUILink}>
      {children}
    </LinkComponentProvider>
  );
}
