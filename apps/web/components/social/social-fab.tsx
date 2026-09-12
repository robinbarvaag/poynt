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

/** Myk ease-out — speiler --ease-soft i web.css. */
const EASE_SOFT = [0.22, 1, 0.36, 1] as const;

/**
 * Fjæra som driver morfingen. Litt spenst, men langt unna sprett: fanen skal
 * kjennes som et fysisk objekt som skyves ut, ikke som en ballong.
 */
const MORPH = { type: "spring", duration: 0.5, bounce: 0.2 } as const;

/** Fjær for utglidningen fra kanten — litt raskere, den skjer oftere. */
const SLIDE = { type: "spring", duration: 0.42, bounce: 0.16 } as const;

/** Hvor lenge vi venter etter siste scroll-piksel før fanen sklir ut igjen. */
const SETTLE_MS = 380;

/**
 * Hvor langt fanen er skjøvet ut over høyrekanten (px). Jo høyere tall, jo
 * mindre av den er synlig.
 */
const TUCK = { scrolling: 46, resting: 28, open: 0 } as const;

/**
 * Organisk «fane» som ligger halvveis utenfor høyrekanten, omtrent i
 * øyehøyde — samme grep som Instagram sin nye pluss-knapp.
 *
 * Tre tilstander, én og samme boks som morfer mellom dem:
 * 1. **Skjult** – toppen av siden, eller footeren i synsfeltet (kanalene står
 *    allerede der).
 * 2. **Hvilende** – en myk, halvt bortgjemt form med et pluss-tegn. Mens man
 *    scroller sklir den lenger ut i kanten, så den ikke stjeler blikket.
 * 3. **Åpen** – ett trykk drar hele formen inn på skjermen, den vokser til et
 *    panel med kanalene, og plusset roterer til et kryss.
 *
 * Morfingen går via `layout` i framer-motion: skallet er det samme DOM-
 * elementet hele veien, så størrelse og form interpoleres i stedet for at to
 * elementer krysstoner. Utglidningen ligger på et eget element utenpå, siden
 * `layout` selv eier `transform` på skallet.
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
  // Skiller «lukket av bruker» fra «lukket fordi fanen forsvant», så vi ikke
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

  // Første lenke i panelet tar fokus når det åpner, og knappen får det
  // tilbake når man lukker.
  useEffect(() => {
    if (open) {
      panelRef.current?.querySelector<HTMLElement>("a")?.focus();
      return;
    }
    if (restoreFocus.current) {
      restoreFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [open]);

  const visible = scrolledPast && !footerVisible;

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  const tuck = open ? TUCK.open : scrolling ? TUCK.scrolling : TUCK.resting;
  const morph = reduceMotion ? { duration: 0.2, ease: EASE_SOFT } : MORPH;
  const slide = reduceMotion ? { duration: 0.2, ease: EASE_SOFT } : SLIDE;

  if (links.length === 0) return null;

  return (
    <div
      ref={containerRef}
      // Fanen sitter i øyehøyde langs høyrekanten, ikke nede i hjørnet.
      className="pointer-events-none fixed right-3 bottom-[26vh] z-50 flex justify-end"
    >
      <motion.div
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          // Utglidningen: skjult → langt ut, scrollende → nesten ute,
          // hvilende → halvveis inne, åpen → helt inne.
          transform: `translateX(${visible ? tuck : 88}px)`,
        }}
        transition={slide}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <motion.div
          id={panelId}
          layout
          animate={{
            // Organisk form: elliptiske hjørner gir en mykere, mer «levende»
            // silhuett enn en vanlig pille. Formen roer seg når den åpner.
            borderRadius: open
              ? "34px 30px 30px 34px / 30px 26px 26px 30px"
              : "30px 26px 26px 30px / 34px 30px 30px 34px",
          }}
          transition={morph}
          className={cn(
            "relative min-h-14 min-w-14",
            // Glass: bakgrunnen skinner gjennom, som i Instagram sin nye knapp.
            "bg-card/75 shadow-[0_20px_50px_-18px_rgb(0_0_0/0.45)] ring-1 ring-border/50 backdrop-blur-2xl",
            "supports-backdrop-filter:bg-card/55"
          )}
        >
          {/* Mykt fargeskjær bak glasset, så flaten ikke blir helt død. */}
          <motion.span
            aria-hidden="true"
            layout
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(120%_140%_at_100%_50%,color-mix(in_oklab,var(--color-primary)_24%,transparent),transparent_70%)]"
            animate={{ opacity: open ? 0.85 : 0.4 }}
            transition={morph}
          />

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                ref={panelRef}
                key="panel"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: EASE_SOFT }}
                className="relative w-[min(17.5rem,calc(100vw-1.5rem))] p-2.5 pt-3"
              >
                {/* «Følg» står bare her inne — ute er plusset nok. */}
                <p className="px-2 pr-14 pb-1.5 font-medium text-muted-foreground text-xs tracking-wide">
                  Følg
                </p>

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
                                transform: "translateX(14px) scale(0.97)",
                              }
                        }
                        animate={{
                          opacity: 1,
                          transform: "translateX(0px) scale(1)",
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.26,
                          ease: EASE_SOFT,
                          // Radene sklir inn fra kanten, 40 ms mellom hver.
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
                            "group flex items-center gap-3 rounded-full px-2 py-1.5",
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
            )}
          </AnimatePresence>

          {/* Plusset blir værende gjennom hele morfingen: det står midt i fanen
              når den er lukket, og glir opp i hjørnet når panelet vokser fram.
              `layout` flytter det, så det aldri forsvinner og kommer tilbake. */}
          <motion.button
            ref={triggerRef}
            layout
            type="button"
            onClick={() => {
              if (open) {
                close();
                return;
              }
              restoreFocus.current = false;
              setOpen(true);
            }}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Lukk sosiale kanaler" : "Følg"}
            transition={morph}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            className={cn(
              // Lukket er skallet 3,5 rem bredt og høyt, så 0,5 rem inset
              // setter den 2,5 rem store knappen midt i det.
              "absolute top-2 right-2 grid size-10 place-items-center rounded-full",
              "text-foreground/70 transition-colors duration-200 ease-out",
              "hover:bg-foreground/5 hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            )}
          >
            <motion.svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              className="size-5"
              // Ett og samme tegn: plusset roterer 45° og blir lukkekrysset.
              animate={{ transform: `rotate(${open ? 45 : 0}deg)` }}
              transition={morph}
            >
              <path d="M12 5v14M5 12h14" />
            </motion.svg>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
