"use client";

import type { FeatureLinkProps } from "@poynt/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Lenke for CMS-blokker (featureGrid, hero m.fl.): klientnavigasjon så
 * /kontakt-lenker fanges av modal-interceptoren i stedet for full sidelast,
 * og kontakt-lenker får ?fra= festet til stien brukeren faktisk sto på.
 */
export function BlockLink({ href, ...rest }: FeatureLinkProps) {
  const pathname = usePathname();

  let target = href;
  if (href.startsWith("/kontakt") && pathname) {
    const [path, query] = href.split("?");
    const params = new URLSearchParams(query);
    if (!params.has("fra")) params.set("fra", pathname);
    target = `${path}?${params.toString()}`;
  }

  return <Link {...rest} href={target} scroll={false} />;
}
