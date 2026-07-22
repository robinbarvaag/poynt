"use client";

import { cn } from "@poynt/ui";
import { motion, useReducedMotion } from "framer-motion";
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
  "aria-haspopup"?: boolean;
  "aria-expanded"?: boolean;
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
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openDropdown, setOpenDropdown] = React.useState<number | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const lastY = React.useRef(0);
  // Akkumulert scroll i én retning — nullstilles ved retningsskifte, slik at
  // trackpad-jitter og rubber-band ikke flipper headeren frem og tilbake.
  const scrollAccum = React.useRef(0);

  React.useEffect(() => {
    function handleScroll() {
      // Clamp mot negative verdier (iOS-overscroll rapporterer y < 0).
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY.current;
      lastY.current = y;

      // Hysterese på glass-tilstanden så den ikke blafrer rundt terskelen.
      setScrolled((prev) => (prev ? y > 8 : y > 24));

      if (delta === 0) {
        return;
      }
      if (Math.sign(delta) !== Math.sign(scrollAccum.current)) {
        scrollAccum.current = 0;
      }
      scrollAccum.current += delta;

      // Skjul headeren ved bevisst scroll nedover (forbi 120px), vis igjen ved
      // scroll opp — men først etter 12px sammenhengende bevegelse, så små
      // rykk ikke teller som intensjon.
      if (y < 120) {
        setHidden(false);
      } else if (scrollAccum.current > 12) {
        setHidden(true);
      } else if (scrollAccum.current < -12) {
        setHidden(false);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Vis alltid headeren når mobil-menyen er åpen.
  const isHidden = hidden && !mobileOpen;

  // Hover-intent for dropdowns: liten lukke-forsinkelse så en kort avstikker
  // med pekeren (eller diagonalen ned mot panelet) ikke lukker menyen.
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openMenu = React.useCallback((index: number) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpenDropdown(index);
  }, []);
  const scheduleClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  }, []);
  React.useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
  };
  const itemVariants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: 12 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
        },
      };

  // Lukk mobil-draweren når ruten endrer seg. `pathname` er en bevisst trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname brukes som trigger for å lukke draweren ved navigasjon, ikke i selve effekten
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Segment-bevisst match: «/om» treffer «/om» og «/om/team», ikke «/omsetning».
  const matchesPath = (href: string) => {
    if (pathname == null || href === "#") {
      return false;
    }
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Et toppunkt er aktivt når stien treffer lenken selv ELLER en av
  // under-lenkene — barn av et menypunkt holder foreldren markert.
  const isActive = (item: SiteHeaderNavItem) => {
    if (pathname == null) {
      return item.active ?? false;
    }
    return (
      matchesPath(item.href) ||
      (item.subItems?.some((sub) => matchesPath(sub.href)) ?? false)
    );
  };

  return (
    <header
      className={cn(
        // Kun transform — å fade samtidig gjør gjeninntreden grøtete; baren
        // sklir ut og inn langs samme bane (spatial konsistens).
        "pointer-events-none fixed top-0 z-50 w-full transition-transform duration-300 ease-drawer",
        reduce && "transition-opacity duration-200 ease-out",
        isHidden && (reduce ? "opacity-0" : "-translate-y-full"),
        className
      )}
    >
      <nav
        className={cn(
          // Full-bredde bar limt til toppen. Gjennomsiktig over heroen; blir
          // en tett glass-flate når man scroller. Backdrop-filter og skygge
          // må med i transition-listen — ellers popper bluren inn brått mens
          // fargene toner. Ingen hard 1px-bunnkant — kanten males som en myk
          // gradient under baren (scroll-edge-effekt) i stedet.
          "pointer-events-auto relative w-full transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out",
          scrolled
            ? "bg-background/85 shadow-foreground/5 shadow-sm backdrop-blur-xl"
            : "bg-background/0 shadow-none backdrop-blur-0",
          // Ved redusert bevegelse fader baren i stedet for å skli — da må
          // den også slutte å fange pekeren mens den er usynlig.
          isHidden && "pointer-events-none"
        )}
      >
        {/* Innholdet ligger på samme max-w-6xl-grid som resten av siden, med
            vanlige side-gutters — konvensjonell full-bredde topmeny. */}
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
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
                  onMouseEnter={() => hasSub && openMenu(index)}
                  onMouseLeave={scheduleClose}
                  onFocus={() => hasSub && openMenu(index)}
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      scheduleClose();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setOpenDropdown(null);
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    target={linkTarget(item.external)}
                    rel={linkRel(item.external)}
                    aria-haspopup={hasSub || undefined}
                    aria-expanded={hasSub ? openDropdown === index : undefined}
                    className={cn(
                      "relative flex items-center gap-1 rounded-full px-4 py-2 font-medium text-sm transition-colors",
                      isActive(item)
                        ? "text-foreground"
                        : "text-foreground/65 hover:bg-foreground/5 hover:text-foreground",
                      openDropdown === index &&
                        "bg-foreground/5 text-foreground"
                    )}
                  >
                    {/* Delt pille som glir mellom aktive lenker ved
                        navigasjon (layoutId). */}
                    {isActive(item) && (
                      <motion.span
                        layoutId="site-header-active-pill"
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-foreground/8"
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", bounce: 0, duration: 0.4 }
                        }
                      />
                    )}
                    <span className="relative">{item.label}</span>
                    {hasSub && (
                      <ChevronDown
                        className={cn(
                          "relative size-3.5 transition-transform",
                          openDropdown === index && "rotate-180"
                        )}
                      />
                    )}
                  </Link>

                  {hasSub && openDropdown === index && (
                    <div className="absolute top-full left-0 w-72 pt-2">
                      {/* Origin-bevisst inngang: panelet vokser ut fra
                          triggeren (oppe-venstre), aldri fra scale(0). */}
                      <div className="origin-top-left rounded-3xl bg-background/95 p-2 shadow-foreground/5 shadow-xl ring-1 ring-foreground/10 backdrop-blur-xl motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-top-1 motion-safe:animate-in motion-safe:duration-200">
                        {item.subItems?.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            target={linkTarget(subItem.external)}
                            rel={linkRel(subItem.external)}
                            className={cn(
                              "block rounded-2xl px-3 py-2.5 transition-colors hover:bg-foreground/5",
                              matchesPath(subItem.href) && "bg-foreground/5"
                            )}
                          >
                            <span
                              className={cn(
                                "block font-medium text-sm",
                                matchesPath(subItem.href) && "text-foreground"
                              )}
                            >
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
          <div className="flex items-center gap-2.5">
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

        {/* Scroll-edge: myk gradientkant der innhold møter glass-flaten,
            i stedet for en hard 1px-strek. */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-full h-3 bg-gradient-to-b from-foreground/6 to-transparent transition-opacity duration-300",
            scrolled ? "opacity-100" : "opacity-0"
          )}
        />
      </nav>

      {/* Mobil-drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="pointer-events-auto flex w-[88vw] max-w-sm flex-col gap-0 p-0"
        >
          <SheetHeader className="border-foreground/5 border-b px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5">
            <SheetTitle className="text-left font-bold font-heading text-xl tracking-tight">
              {logo}
            </SheetTitle>
          </SheetHeader>

          <motion.nav
            initial="hidden"
            animate="visible"
            variants={listVariants}
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5"
          >
            {navItems.map((item) => (
              <motion.div key={item.label} variants={itemVariants}>
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
                        className={cn(
                          "block rounded-xl px-3 py-2 text-sm transition-colors",
                          matchesPath(subItem.href)
                            ? "font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.nav>

          {mobileFooter && (
            <div className="flex flex-col gap-2 border-foreground/5 border-t px-6 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {mobileFooter}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}
