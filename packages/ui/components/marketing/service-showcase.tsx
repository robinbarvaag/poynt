"use client";

import { AnimatePresence, motion } from "framer-motion";
import type * as React from "react";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import {
  CloseIcon,
  ImageFrame,
  PanelFade,
  ShowcaseModal,
  useModalBehavior,
} from "./showcase-modal";

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
  /** Mål-URL for kortet i `ServiceShowcaseGrid` (rute-drevet variant). */
  href?: string;
}

export interface ServiceShowcaseLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
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

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4", className)}
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

/** Innholdet i et tjenestekort — delt mellom knapp- og lenkevarianten. */
function CardBody({
  service,
  featured,
}: {
  service: ServiceShowcaseItem;
  featured: boolean;
}) {
  return (
    <>
      <ImageFrame
        image={service.image}
        className={cn(
          "aspect-4/3",
          featured && "sm:aspect-auto sm:h-full sm:w-1/2 sm:shrink-0"
        )}
      />
      <div
        className={cn(
          "flex flex-1 flex-col p-6",
          featured && "sm:justify-center sm:p-8"
        )}
      >
        <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
          {service.eyebrow ?? "Tjeneste"}
        </span>
        <h3
          className={cn(
            "mt-1.5 font-bold font-heading text-lg leading-snug tracking-tight",
            featured && "sm:text-2xl"
          )}
        >
          {service.name}
        </h3>
        {service.price && (
          <p className="mt-1 font-semibold text-primary">{service.price}</p>
        )}
        <p
          className={cn(
            "mt-3 text-muted-foreground text-sm leading-relaxed",
            featured ? "line-clamp-3" : "line-clamp-2"
          )}
        >
          {service.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 font-semibold text-foreground text-sm transition-colors">
          Les mer
          <ArrowRight className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
        </span>
      </div>
    </>
  );
}

const cardShellClasses =
  "group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl bg-card text-left shadow-sm ring-1 ring-foreground/10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** Tekst- og CTA-innholdet i det åpne panelet — delt mellom variantene. */
function PanelBody({
  service,
  ctaLinkComponent: CtaLink,
}: {
  service: ServiceShowcaseItem;
  ctaLinkComponent?: React.ComponentType<ServiceShowcaseLinkProps>;
}) {
  return (
    <>
      <span className="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]">
        {service.eyebrow ?? "Tjeneste"}
      </span>
      <h2 className="mt-2 font-bold font-heading text-3xl leading-tight tracking-tight md:text-4xl">
        {service.name}
      </h2>
      {service.price && (
        <p className="mt-2 font-semibold text-primary text-xl">
          {service.price}
        </p>
      )}
      <p className="mt-5 text-base text-muted-foreground leading-relaxed">
        {service.description}
      </p>
      {service.details && (
        <div className="mt-5 text-base leading-relaxed">{service.details}</div>
      )}
      {service.ctaHref &&
        (CtaLink ? (
          <CtaLink
            href={service.ctaHref}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-sm transition-colors"
          >
            {service.ctaLabel ?? "Ta kontakt"}
            <ArrowRight className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
          </CtaLink>
        ) : (
          <UILink
            href={service.ctaHref}
            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-primary-foreground text-sm transition-colors"
          >
            {service.ctaLabel ?? "Ta kontakt"}
            <ArrowRight className="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" />
          </UILink>
        ))}
    </>
  );
}

export interface ServiceShowcaseGridProps {
  services: ServiceShowcaseItem[];
  className?: string;
  /**
   * Lenkekomponent for kortene (typisk next/link). Kort uten `href` hoppes
   * over. Default er en vanlig <a>.
   */
  linkComponent?: React.ComponentType<ServiceShowcaseLinkProps>;
}

/**
 * Rute-drevet variant av tjeneste-oversikten: hvert kort er en ekte lenke
 * (crawlbar, delbar) i stedet for en knapp med lokal stat. Kortene bærer samme
 * `layoutId` som `ServiceShowcaseModal`, så når lenken fanges av en
 * intercepting-route og modalet monteres, «zoomer» kortet åpent via delt
 * layout-animasjon — samme lekenhet som den stat-drevne `ServiceShowcase`.
 */
export function ServiceShowcaseGrid({
  services,
  className,
  linkComponent: LinkComp,
}: ServiceShowcaseGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-flow-row-dense grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {services.map((service) => {
        if (!service.href) {
          return null;
        }
        const isFeatured = service.featured ?? false;
        const linkProps = {
          href: service.href,
          "aria-label": `Vis mer om ${service.name}`,
          className: cn(cardShellClasses, isFeatured && "sm:flex-row"),
          children: <CardBody service={service} featured={isFeatured} />,
        } satisfies ServiceShowcaseLinkProps;
        return (
          <li
            key={service.id}
            className={cn("h-full", isFeatured && "sm:col-span-2")}
          >
            <motion.div
              layoutId={`service-${service.id}`}
              className="h-full overflow-hidden rounded-3xl"
            >
              {LinkComp ? (
                <LinkComp {...linkProps} />
              ) : (
                <UILink {...linkProps} />
              )}
            </motion.div>
          </li>
        );
      })}
    </ul>
  );
}

export interface ServiceShowcaseModalProps {
  service: ServiceShowcaseItem;
  /**
   * Kalles ETTER at exit-animasjonen er ferdig — typisk `router.back()` når
   * modalet rendres via en intercepting-route.
   */
  onClosed: () => void;
  ctaLinkComponent?: React.ComponentType<ServiceShowcaseLinkProps>;
}

/**
 * Det åpne tjenestepanelet som frittstående modal, ment for en
 * intercepting-route (`@modal/(.)tjenester/[slug]`). Deler `layoutId` med
 * kortene i `ServiceShowcaseGrid` — se `ShowcaseModal` for skall-oppførselen.
 */
export function ServiceShowcaseModal({
  service,
  onClosed,
  ctaLinkComponent,
}: ServiceShowcaseModalProps) {
  return (
    <ShowcaseModal
      onClosed={onClosed}
      ariaLabel={service.name}
      image={service.image}
      layoutId={`service-${service.id}`}
    >
      <PanelBody service={service} ctaLinkComponent={ctaLinkComponent} />
    </ShowcaseModal>
  );
}

/**
 * Tjeneste-oversikt der et kort «zoomer» åpent til et panel via delt
 * layout-animasjon (framer-motion `layoutId`). Egner seg når hver tjeneste er
 * en kort beskrivelse + pris + «ta kontakt» — da slipper man tynne egne sider.
 * Presentasjons-only og kontrollert (appen eier åpen/lukk-staten).
 *
 * NB: nettsiden bruker den rute-drevne `ServiceShowcaseGrid` +
 * `ServiceShowcaseModal` i stedet (URL per tjeneste, bedre SEO); denne
 * kontrollerte varianten beholdes for enkle innslag uten egne ruter.
 */
export function ServiceShowcase({
  services,
  activeId,
  onSelect,
  onClose,
  className,
  ctaLinkComponent,
}: ServiceShowcaseProps) {
  const active = services.find((s) => s.id === activeId) ?? null;

  useModalBehavior(!!active, onClose);

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
                className={cn(cardShellClasses, isFeatured && "sm:flex-row")}
              >
                <CardBody service={service} featured={isFeatured} />
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

              <PanelFade>
                <PanelBody
                  service={active}
                  ctaLinkComponent={ctaLinkComponent}
                />
              </PanelFade>
            </motion.dialog>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
