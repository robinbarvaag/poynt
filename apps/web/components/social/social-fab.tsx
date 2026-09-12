"use client";

import { cn } from "@poynt/ui";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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

/** Antall ikoner som ligger i stabelen når docken er lukket. */
const PEEK_COUNT = 3;

/** Myk ease-out — speiler --ease-soft i web.css. */
const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * Fjæra som driver morfingen. Litt spenst, men langt unna sprett: docken skal
 * kjennes som et fysisk objekt som utvider seg, ikke som en ballong.
 */
const MORPH = { type: "spring", duration: 0.5, bounce: 0.22 } as const;

/** Hvor lenge vi venter etter siste scroll-piksel før docken folder seg ut. */
const SETTLE_MS = 420;

/**
 * Flytende «dock» nede til høyre med kanalene våre.
 *
 * Tre tilstander, én og samme boks som morfer mellom dem:
 * 1. **Skjult** – toppen av siden, eller footeren i synsfeltet (kanalene står
 *    allerede der).
 * 2. **Sammentrukket** – mens man scroller krymper docken til en liten
 *    ikonstabel, så den ikke stjeler oppmerksomhet fra lesingen.
 * 3. **Utfoldet** – står scrollen stille vokser den til en pille med tekst, og
 *    ett trykk morfer den videre til et panel med alle kanalene.
 *
 * Morfingen går via `layout` i framer-motion: boksen er det samme DOM-elementet
 * hele veien, så størrelse, radius og posisjon interpoleres i stedet for at to
 * elementer krysstoner.
 */
export function SocialFab({
  links,
  hideNearSelector = "#site-footer",
}: SocialFabProps) {
  const [open, setOpen] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Skiller «lukket av bruker» fra «lukket fordi docken forsvant», så vi ikke
  // river fokus tilbake til en knapp som ikke lenger er synlig.
  const restoreFocus = useRef(false);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let settleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setScrolledPast(window.scrollY > 280);
      setScrolling(true);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => setScrolling(false), SETTLE_MS);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("scroll", onScroll);
    };
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

  const close = useCallback(() => {
    restoreFocus.current = true;
    setOpen(false);
  }, []);

  // Knappen forsvinner når panelet morfer fram, så fokus må flyttes med.
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
      return;
    }
    if (restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

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

  // Mens man scroller trekker docken seg sammen — men aldri mens den er åpen,
  // da ville panelet rykket bort under fingeren.
  const compact = scrolling && !open;
  const peek = links.slice(0, PEEK_COUNT);
  const morph = reduceMotion ? { duration: 0.2, ease: EASE_SOFT } : MORPH;

  if (links.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex justify-end sm:right-6 sm:bottom-6"
    >
      <motion.div
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0px) scale(1)"
            : reduceMotion
              ? "translateY(0px) scale(1)"
              : "translateY(16px) scale(0.94)",
        }}
        transition={{ duration: 0.28, ease: EASE_SOFT }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <motion.div
          id={panelId}
          layout
          animate={{ borderRadius: open ? 28 : 999 }}
          transition={morph}
          className={cn(
            "relative overflow-hidden",
            // Glass: bakgrunnen skinner gjennom, som i det nye Instagram-baret.
            "bg-card/80 shadow-[0_18px_50px_-20px_rgb(0_0_0/0.45)] ring-1 ring-border/60 backdrop-blur-xl",
            "supports-backdrop-filter:bg-card/60"
          )}
        >
          {/* Mykt fargeskjær i bakkant, så flaten ikke blir helt død. */}
          <motion.span
            aria-hidden="true"
            layout
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_140%_at_100%_100%,color-mix(in_oklab,var(--color-primary)_22%,transparent),transparent_65%)]"
            animate={{ opacity: open ? 0.9 : 0.45 }}
            transition={morph}
          />

          <AnimatePresence initial={false} mode="popLayout">
            {open ? (
              <motion.div
                key="panel"
                ref={panelRef}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_SOFT }}
                className="relative w-[min(19rem,calc(100vw-2rem))] p-3"
              >
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="font-medium text-muted-foreground text-xs">
                    Følg oss
                  </span>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Lukk sosiale kanaler"
                    className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>

                <ul className="flex flex-col">
                  {links.map((link, index) => {
                    const label = socialLabel(link.platform);
                    return (
                      <motion.li
                        key={link.platform}
                        initial={
                          reduceMotion
                            ? { opacity: 0 }
                            : {
                                opacity: 0,
                                transform: "translateY(8px) scale(0.97)",
                              }
                        }
                        animate={{
                          opacity: 1,
                          transform: "translateY(0px) scale(1)",
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.26,
                          ease: EASE_SOFT,
                          // Radene kommer inn ovenfra og ned, 40 ms mellom hver.
                          delay: reduceMotion ? 0 : 0.04 * index,
                        }}
                      >
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${label} (åpnes i ny fane)`}
                          style={
                            {
                              "--brand": socialColor(link.platform),
                            } as React.CSSProperties
                          }
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl px-2 py-2",
                            "transition-colors duration-200 ease-out",
                            "hover:bg-foreground/4",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand)"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-9 shrink-0 place-items-center rounded-full",
                              "bg-(--brand)/10 text-(--brand)",
                              "transition-transform duration-200 ease-out",
                              "motion-safe:group-hover:scale-105 motion-safe:group-active:scale-95"
                            )}
                          >
                            <SocialIcon
                              platform={link.platform}
                              className="size-4.5"
                            />
                          </span>
                          <span className="font-medium text-foreground text-sm">
                            {label}
                          </span>
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                              "ml-auto size-4 text-muted-foreground/60",
                              "transition-[opacity,transform] duration-200 ease-out",
                              "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                              "motion-safe:-translate-x-1 motion-safe:group-hover:translate-x-0"
                            )}
                          >
                            <path d="M7 17 17 7M9 7h8v8" />
                          </svg>
                        </a>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            ) : (
              <motion.button
                key="trigger"
                ref={triggerRef}
                layout
                type="button"
                onClick={() => {
                  restoreFocus.current = false;
                  setOpen(true);
                }}
                aria-expanded={false}
                aria-controls={panelId}
                aria-label="Følg oss i sosiale kanaler"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_SOFT }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                className={cn(
                  "relative flex items-center gap-2 py-2 pr-2 pl-3",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                {/* Teksten forsvinner når man scroller — bare stabelen blir
                    igjen, og boksen krymper rundt den. */}
                <AnimatePresence initial={false} mode="popLayout">
                  {!compact && (
                    <motion.span
                      key="label"
                      layout
                      initial={{ opacity: 0, transform: "scale(0.9)" }}
                      animate={{ opacity: 1, transform: "scale(1)" }}
                      exit={{ opacity: 0, transform: "scale(0.9)" }}
                      transition={{ duration: 0.18, ease: EASE_SOFT }}
                      className="whitespace-nowrap font-medium text-foreground text-sm"
                    >
                      Følg oss
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Ikonstabelen: overlappende brikker, som en avatargruppe. */}
                <motion.span layout className="flex items-center">
                  {peek.map((link, index) => (
                    <motion.span
                      key={link.platform}
                      layout
                      aria-hidden="true"
                      style={
                        {
                          "--brand": socialColor(link.platform),
                          zIndex: peek.length - index,
                        } as React.CSSProperties
                      }
                      transition={morph}
                      className={cn(
                        "grid size-8 place-items-center rounded-full",
                        "bg-card text-(--brand) ring-2 ring-card",
                        index > 0 && "-ml-2"
                      )}
                    >
                      <SocialIcon platform={link.platform} className="size-4" />
                    </motion.span>
                  ))}
                </motion.span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
