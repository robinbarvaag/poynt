"use client";

import { cn } from "@poynt/ui";
import { Share2, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  SocialIcon,
  type SocialLink,
  socialColor,
  socialLabel,
} from "./platforms";

interface SocialFabProps {
  links: SocialLink[];
  /** Elementet som gjør knappen overflødig når det er i synsfeltet. */
  hideNearSelector?: string;
}

/**
 * Liten flytende knapp nede til høyre som slår kanalene ut i en vifte.
 *
 * Den viser seg først når man har scrollet forbi toppen, og trekker seg
 * tilbake når footeren kommer til syne — der står de samme kanalene allerede.
 */
export function SocialFab({
  links,
  hideNearSelector = "#site-footer",
}: SocialFabProps) {
  const [open, setOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const onScroll = () => setScrolledPast(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const footer = document.querySelector(hideNearSelector);
    if (!footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry?.isIntersecting ?? false),
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, [hideNearSelector]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const visible = scrolledPast && !footerVisible;

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  if (links.length === 0) return null;

  return (
    <div
      ref={containerRef}
      // Hover åpner vifta på pekerenheter; klikk gjør samme jobb på touch.
      onMouseEnter={() => visible && setOpen(true)}
      onMouseLeave={close}
      className={cn(
        "fixed right-4 bottom-4 z-50 flex flex-col items-center gap-3 sm:right-6 sm:bottom-6",
        "transition-[opacity,transform] duration-300 ease-out",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ul
        id={listId}
        className="flex flex-col items-center gap-2"
        // Skjult for tastatur og skjermleser når vifta er lukket, slik at
        // tabbing ikke havner i usynlige lenker.
        inert={!open}
      >
        {links.map((link, index) => {
          const label = socialLabel(link.platform);
          // Nederste ikon starter først ut, og går sist inn igjen.
          const delay = open ? (links.length - 1 - index) * 45 : index * 35;
          return (
            <li key={link.platform}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={open ? undefined : -1}
                aria-label={`${label} (åpnes i ny fane)`}
                style={
                  {
                    "--brand": socialColor(link.platform),
                    transitionDelay: `${delay}ms`,
                  } as React.CSSProperties
                }
                className={cn(
                  "group relative grid size-11 place-items-center rounded-full",
                  "border border-border/70 bg-card text-foreground shadow-lg shadow-foreground/5",
                  "transition-[opacity,transform,color,box-shadow] duration-300 ease-out",
                  "hover:text-[var(--brand)] hover:shadow-[0_10px_30px_-12px_var(--brand)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]",
                  open
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none translate-y-6 scale-75 opacity-0",
                  "motion-safe:hover:scale-110"
                )}
              >
                <SocialIcon platform={link.platform} className="size-5" />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-foreground px-2 py-1 font-medium text-[11px] text-background opacity-0 shadow-sm transition-opacity duration-200 group-focus-visible:opacity-100 group-hover:opacity-100 sm:block"
                >
                  {label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={open ? "Lukk sosiale kanaler" : "Følg oss"}
        className={cn(
          "grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25",
          "transition-[transform,box-shadow] duration-300 ease-out",
          "hover:shadow-primary/40 hover:shadow-xl",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "motion-safe:hover:scale-105 motion-safe:active:scale-95"
        )}
      >
        {/* Begge ikonene ligger i samme celle og krysser hverandre i rotasjon. */}
        <span className="relative grid size-5 place-items-center">
          <Share2
            aria-hidden="true"
            className={cn(
              "absolute size-5 transition-[opacity,transform] duration-300 ease-out",
              open
                ? "rotate-90 scale-50 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            )}
          />
          <X
            aria-hidden="true"
            className={cn(
              "absolute size-5 transition-[opacity,transform] duration-300 ease-out",
              open
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-50 opacity-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}
