"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { universeHome } from "@/lib/universe";
import type { Universe } from "@/payload-types";
import { Button, SiteHeader, type SiteHeaderLinkProps } from "@poynt/ui";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface UniverseHeaderProps {
  siteName?: string;
  logo?: MediaResource | null;
  header?: Universe["header"];
}

// next/link som SiteHeader sin lenkekomponent (klient-navigasjon + prefetch).
function NavLink({ href, children, ...rest }: SiteHeaderLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

/**
 * Headeren inne i «Verdifull vekst-universet».
 *
 * Bevisst det samme skallet som resten av nettstedet (samme bar, samme glass,
 * samme logo) — gjenkjennelsen skal være intakt. Det som er byttet ut er hva
 * baren peker på:
 *
 * - Logoen går til universets forside, ikke til poynt.no. Logoen er den
 *   knappen folk trykker på når de vil «tilbake», og da skal de ikke havne ut
 *   av det de holder på med.
 * - Ingen toppmeny. Kapitlene ligger allerede i sidemenyen på siden (HubLayout),
 *   så navigasjonen peker innover mens man er inne.
 * - Én diskret utgang til høyre. Den som VIL ut, skal få lov — men den skal
 *   ikke rope like høyt som innholdet.
 *
 * Resten av nettstedet forsvinner ikke: hele Poynt-bunnteksten står under
 * innholdet, der man kommer etter å ha vært gjennom universet.
 *
 * Navnet ved siden av logoen, og om veien ut vises i det hele tatt, styres fra
 * globalen «Verdifull vekst-universet» i admin.
 */
export function UniverseHeader({
  siteName = "Poynt",
  logo,
  header,
}: UniverseHeaderProps) {
  const label = header?.label?.trim();
  const showExit = header?.showExit !== false;
  const exitLabel = header?.exitLabel?.trim() || "Til poynt.no";

  const logoNode = (
    <span className="flex items-center gap-2.5">
      {logo?.url ? (
        <PayloadImage
          media={logo}
          alt={logo.alt || siteName}
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      ) : (
        siteName
      )}
      {/* Skillestrek + universets navn: sier hvor du er, uten å ta plassen til
          en meny. Tomt navn i admin = bare logoen.
          Skjult på de smaleste skjermene — der blir logo + navn + veien ut for
          trangt, og navnet er det innholdet uansett sier først. */}
      {label && (
        <>
          <span
            aria-hidden
            className="hidden h-5 w-px shrink-0 bg-foreground/15 sm:block"
          />
          <span className="hidden whitespace-nowrap font-heading font-semibold text-[0.95rem] text-foreground/70 tracking-tight sm:inline">
            {label}
          </span>
        </>
      )}
    </span>
  );

  return (
    <SiteHeader
      logo={logoNode}
      homeHref={universeHome}
      linkComponent={NavLink}
      navItems={[]}
      actions={
        showExit ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-foreground/60 hover:text-foreground"
          >
            <Link href="/">
              {exitLabel}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}
