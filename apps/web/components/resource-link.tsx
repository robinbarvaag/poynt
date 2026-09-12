"use client";

import { BlockLink } from "@/components/block-link";
import type { ResourceLinkProps } from "@poynt/ui";

/**
 * Lenke for ressurskort. Eksterne lenker skal ikke gå gjennom next/link
 * (prefetch av fremmede domener), og nedlastinger heller ikke — BlockLink
 * brukes bare for interne stier, resten er en vanlig <a>.
 *
 * Egen klient-modul: `ResourceGrid` er en klient-komponent, og en funksjon
 * kan bare sendes inn fra en server-komponent når den er en klient-referanse.
 */
export function ResourceLink({
  href,
  download,
  target,
  rel,
  className,
  children,
}: ResourceLinkProps) {
  if (download || /^https?:/i.test(href)) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={className}
        {...(download ? { download: true } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <BlockLink href={href} className={className}>
      {children}
    </BlockLink>
  );
}
