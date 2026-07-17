"use client";

import { cn } from "@poynt/ui";
import { ChevronDown, Menu } from "lucide-react";
import * as React from "react";
import { Button } from "./button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";

export interface SiteHeaderSubItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
}

export interface SiteHeaderNavItem {
  label: string;
  href: string;
  /** Marker som aktiv manuelt. Ignoreres hvis `pathname` er gitt på headeren. */
  active?: boolean;
  external?: boolean;
  subItems?: SiteHeaderSubItem[];
}

export interface SiteHeaderLinkProps {
  href: string;
  className?: string;
  children?: React.ReactNode;
  target?: string;
  rel?: string;
  onClick?: () => void;
}

/** Lenkekomponent — send inn `next/link` for klient-navigasjon. Default: <a>. */
export type SiteHeaderLink = React.ComponentType<SiteHeaderLinkProps>;

export interface SiteHeaderProps {
  /** Logo-slot (f.eks. et `next/image` eller tekst). */
  logo: React.ReactNode;
  homeHref?: string;
  navItems?: SiteHeaderNavItem[];
  /** Høyre handlingsklynge i baren (søk/login/handlekurv/CTA) — alltid synlig. */
  actions?: React.ReactNode;
  /** Innhold nederst i mobil-draweren (f.eks. login + CTA i full bredde). */
  mobileFooter?: React.ReactNode;
  /** Lenkekomponent for all navigasjon. Default vanlig `<a>`. */
  linkComponent?: SiteHeaderLink;
  /**
   * Nåværende sti (f.eks. fra `usePathname()`). Brukes til å markere aktiv lenke
   * og til å lukke mobil-draweren automatisk ved navigasjon.
   */
  pathname?: string;
  className?: string;
}

function DefaultLink({ href, ...props }: SiteHeaderLinkProps) {
  return <a href={href} {...props} />;
}

function linkRel(external?: boolean) {
  return external ? "noopener noreferrer" : undefined;
}

function linkTarget(external?: boolean) {
  return external ? "_blank" : undefined;
}

/**
 * Presentasjonell shell for nettstedets header: en flytende «pill» med subtil
 * glass-morphisme (tettere på scroll), desktop-navigasjon med dropdowns, og en
 * mobil-drawer (Sheet). Eier kun struktur/oppførsel — data, logo, handlekurv og
 * lenke-implementasjon sendes inn via slots/props.
 */
export function SiteHeader({
  logo,
  homeHref = "/",
  navItems = [],
  actions,
  mobileFooter,
  linkComponent,
  pathname,
  className,
}: SiteHeaderProps) {
  const Link = linkComponent ?? DefaultLink;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 16);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lukk mobil-draweren når ruten endrer seg. `pathname` er en bevisst trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname brukes som trigger for å lukke draweren ved navigasjon, ikke i selve effekten
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: SiteHeaderNavItem) => {
    if (pathname == null) {
      return item.active ?? false;
    }
    return item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href);
  };

  return (
    <header
      className={cn(
        "pointer-events-none fixed top-0 z-50 w-full px-4 pt-4 sm:px-6 lg:px-8",
        className
      )}
    >
      <nav
        className={cn(
          // Full bredde-bar på mobil; kompakt, sentrert «øy» som hugger
          // innholdet fra md og opp — ligger da ikke lenger på linje med
          // innholdskolonnen, men flyter som et eget element.
          "pointer-events-auto mx-auto w-full rounded-full transition-all duration-300 md:w-fit",
          scrolled
            ? "bg-background/85 shadow-foreground/5 shadow-lg ring-1 ring-foreground/10 backdrop-blur-xl"
            : "bg-background/55 ring-1 ring-foreground/5 backdrop-blur-md"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 pr-3.5 pl-5 sm:pl-6 md:gap-8 md:pr-3">
          {/* Merk: på md+ hugger pillen innholdet, så gap-8 gir luft mellom
              logo / nav / handlinger i stedet for at justify-between strekker. */}
          <Link
            href={homeHref}
            className="flex shrink-0 items-center gap-2 font-bold font-heading text-foreground text-xl tracking-tight"
          >
            {logo}
          </Link>

          {/* Desktop-navigasjon */}
          <div className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item, index) => {
              const hasSub = !!item.subItems?.length;
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => hasSub && setOpenDropdown(index)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    href={item.href}
                    target={linkTarget(item.external)}
                    rel={linkRel(item.external)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-4 py-2 font-medium text-sm transition-colors",
                      isActive(item)
                        ? "bg-foreground/8 text-foreground"
                        : "text-foreground/65 hover:bg-foreground/5 hover:text-foreground",
                      openDropdown === index &&
                        "bg-foreground/5 text-foreground"
                    )}
                  >
                    {item.label}
                    {hasSub && (
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          openDropdown === index && "rotate-180"
                        )}
                      />
                    )}
                  </Link>

                  {hasSub && openDropdown === index && (
                    <div className="absolute top-full left-0 w-72 pt-2">
                      <div className="rounded-3xl bg-background/95 p-2 shadow-foreground/5 shadow-xl ring-1 ring-foreground/10 backdrop-blur-xl">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            target={linkTarget(subItem.external)}
                            rel={linkRel(subItem.external)}
                            className="block rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/5"
                          >
                            <span className="block font-medium text-sm">
                              {subItem.label}
                            </span>
                            {subItem.description && (
                              <span className="mt-0.5 block text-muted-foreground text-xs">
                                {subItem.description}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Handlinger */}
          <div className="flex items-center gap-1.5">
            {actions}
            {navItems.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Meny"
                className="size-9 rounded-full md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobil-drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="pointer-events-auto w-[88vw] max-w-sm gap-0 p-0"
        >
          <SheetHeader className="border-foreground/5 border-b px-6 py-5">
            <SheetTitle className="text-left font-bold font-heading text-xl tracking-tight">
              {logo}
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
            {navItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  target={linkTarget(item.external)}
                  rel={linkRel(item.external)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block rounded-2xl px-4 py-3 font-heading font-semibold text-lg transition-colors",
                    isActive(item)
                      ? "bg-foreground/8 text-foreground"
                      : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
                {item.subItems && item.subItems.length > 0 && (
                  <div className="mt-1 ml-4 flex flex-col gap-0.5 border-foreground/10 border-l-2 pl-3">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        target={linkTarget(subItem.external)}
                        rel={linkRel(subItem.external)}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-xl px-3 py-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {mobileFooter && (
            <div className="flex flex-col gap-2 border-foreground/5 border-t px-6 py-5">
              {mobileFooter}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
