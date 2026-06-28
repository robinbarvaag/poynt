"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import type * as React from "react";
import { cn } from "../../lib/utils";

export interface ServiceShowcaseItem {
  id: string | number;
  name: string;
  /** Ferdig formatert pris, f.eks. "5 000 kr + mva" eller "Ta kontakt for pris". */
  price?: string;
  /** Kort beskrivelse — vises både i kortet og (ufortettet) i panelet. */
  description: string;
  /** Liten ledetekst over navnet. Default "Tjeneste". */
  eyebrow?: string;
  /** Media-slot (f.eks. next/image med fill). */
  image?: React.ReactNode;
  /** Fremhev som et bredt kort over 2 kolonner (horisontalt oppsett). */
  featured?: boolean;
  /** Valgfritt rikt innhold som vises under beskrivelsen i panelet. */
  details?: React.ReactNode;
  /** Handlingslenke i panelet. */
  ctaLabel?: string;
  ctaHref?: string;
}

export interface ServiceShowcaseLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export interface ServiceShowcaseProps {
  services: ServiceShowcaseItem[];
  /** Hvilken som er åpen (id) — kontrollert. */
  activeId: string | number | null;
  onSelect: (id: string | number) => void;
  onClose: () => void;
  className?: string;
  /**
   * Lenkekomponent for handlingsknappen (f.eks. next/link, eller en ContactLink
   * som åpner kontaktmodalet via klient-navigasjon). Default er en vanlig <a>,
   * som gir full sidelast.
   */
  ctaLinkComponent?: React.ComponentType<ServiceShowcaseLinkProps>;
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ImageFrame({
  image,
  className,
}: {
  image?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {image ?? (
        <div className="flex size-full items-center justify-center bg-foreground/5">
          <span
            aria-hidden="true"
            className="size-12 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-foreground/10"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Tjeneste-oversikt der et kort «zoomer» åpent til et panel via delt
 * layout-animasjon (framer-motion `layoutId`). Egner seg når hver tjeneste er
 * en kort beskrivelse + pris + «ta kontakt» — da slipper man tynne egne sider.
 * Presentasjons-only og kontrollert (appen eier åpen/lukk-staten).
 */
export function ServiceShowcase({
  services,
  activeId,
  onSelect,
  onClose,
  className,
  ctaLinkComponent: CtaLink,
}: ServiceShowcaseProps) {
  const reduce = useReducedMotion();
  const active = services.find((s) => s.id === activeId) ?? null;

  // Escape lukker, og lås body-scroll mens panelet er åpent.
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [active, onClose]);

  return (
    <>
      <ul
        className={cn(
          "grid grid-flow-row-dense grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
      >
        {services.map((service) => {
          const isFeatured = service.featured ?? false;
          return (
            <li
              key={service.id}
              className={cn("h-full", isFeatured && "sm:col-span-2")}
            >
              <motion.button
                type="button"
                layoutId={`service-${service.id}`}
                onClick={() => onSelect(service.id)}
                aria-label={`Vis mer om ${service.name}`}
                className={cn(
                  "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-card text-left shadow-sm ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isFeatured && "sm:flex-row"
                )}
              >
                <ImageFrame
                  image={service.image}
                  className={cn(
                    "aspect-4/3",
                    isFeatured &&
                      "sm:aspect-auto sm:h-full sm:w-1/2 sm:shrink-0"
                  )}
                />
                <div
                  className={cn(
                    "flex flex-1 flex-col p-6",
                    isFeatured && "sm:justify-center sm:p-8"
                  )}
                >
                  <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
                    {service.eyebrow ?? "Tjeneste"}
                  </span>
                  <h3
                    className={cn(
                      "mt-1.5 font-bold font-heading text-lg leading-snug tracking-tight",
                      isFeatured && "sm:text-2xl"
                    )}
                  >
                    {service.name}
                  </h3>
                  {service.price && (
                    <p className="mt-1 font-semibold text-primary">
                      {service.price}
                    </p>
                  )}
                  <p
                    className={cn(
                      "mt-3 text-muted-foreground text-sm leading-relaxed",
                      isFeatured ? "line-clamp-3" : "line-clamp-2"
                    )}
                  >
                    {service.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-foreground text-sm transition-all group-hover:gap-2.5">
                    Les mer
                    <ArrowRight />
                  </span>
                </div>
              </motion.button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.button
              type="button"
              aria-label="Lukk"
              onClick={onClose}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.dialog
              open
              layoutId={`service-${active.id}`}
              className="relative z-10 m-0 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border-0 bg-card p-0 text-foreground shadow-2xl ring-1 ring-foreground/10"
              aria-label={active.name}
            >
              <ImageFrame
                image={active.image}
                className="aspect-video shrink-0"
              />
              <button
                type="button"
                onClick={onClose}
                aria-label="Lukk"
                className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-foreground/10 transition-colors hover:bg-background"
              >
                <CloseIcon />
              </button>

              <motion.div
                className="flex-1 overflow-y-auto p-8 md:p-10"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.25 }}
              >
                <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
                  {active.eyebrow ?? "Tjeneste"}
                </span>
                <h2 className="mt-2 font-bold font-heading text-3xl leading-tight tracking-tight md:text-4xl">
                  {active.name}
                </h2>
                {active.price && (
                  <p className="mt-2 font-semibold text-primary text-xl">
                    {active.price}
                  </p>
                )}
                <p className="mt-5 text-base text-muted-foreground leading-relaxed">
                  {active.description}
                </p>
                {active.details && (
                  <div className="mt-5 text-base leading-relaxed">
                    {active.details}
                  </div>
                )}
                {active.ctaHref &&
                  (CtaLink ? (
                    <CtaLink
                      href={active.ctaHref}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-sm transition-all hover:gap-3"
                    >
                      {active.ctaLabel ?? "Ta kontakt"}
                      <ArrowRight />
                    </CtaLink>
                  ) : (
                    <a
                      href={active.ctaHref}
                      className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-sm transition-all hover:gap-3"
                    >
                      {active.ctaLabel ?? "Ta kontakt"}
                      <ArrowRight />
                    </a>
                  ))}
              </motion.div>
            </motion.dialog>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
