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

/** Fjær for utvidelsen. Litt spenst, ikke sprett. */
const POP = { type: "spring", duration: 0.42, bounce: 0.18 } as const;

/** Fjær for vippingen mot kanten — skjer ofte, så den er kjappere. */
const TILT = { type: "spring", duration: 0.5, bounce: 0.1 } as const;

/** Hvor lenge vi venter etter siste scroll-piksel før fanen retter seg opp. */
const SETTLE_MS = 320;

/** Antall merker som vises i stabelen når fanen er lukket. */
const PEEK_COUNT = 3;

/**
 * Organiske hjørner: ulike radier horisontalt og vertikalt gir en asymmetrisk,
 * litt «håndtegnet» silhuett i stedet for en maskinell pille. Verdiene er
 * statiske — de animeres aldri, så flatene slipper å males om per frame.
 */
const BLOB_TAB = "2.1rem 1.8rem 2.3rem 2rem / 2.6rem 2.9rem 2.2rem 2.4rem";
const BLOB_PANEL = "2.4rem 1.9rem 2.6rem 2.1rem / 2.1rem 2.6rem 1.9rem 2.4rem";

/**
 * Organisk «fane» som ligger langs høyrekanten, omtrent i øyehøyde.
 *
 * Den er synlig hele tiden, ikke gjemt bak et scroll-triks: i ro står den
 * inntil kanten med en liten stabel av kanalmerkene. Scroller man, vipper og
 * sklir den litt ut mot kanten, som om farten dytter den unna. Ett trykk og
 * den vokser til et panel med alle kanalene.
 *
 * **Ytelse.** Ingenting her animerer størrelse eller form. De to flatene ligger
 * oppå hverandre, forankret i samme hjørne, og bytter plass med `transform` og
 * `opacity` alene. Det var morfingen via `layout` som hakket: å endre bredde
 * på en flate med `backdrop-filter` tvinger fram ny layout, maling og ny
 * uskarphetsberegning i hver eneste frame.
 */
export function SocialFab({
  links,
  hideNearSelector = "#site-footer",
}: SocialFabProps) {
  const [open, setOpen] = useState(false);
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
      setScrolling(true);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => setScrolling(false), SETTLE_MS);
    };
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

  // Knappen er skjult mens panelet står åpent, så fokus må følge med begge
  // veier.
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

  const visible = !footerVisible;

  useEffect(() => {
    if (!visible) setOpen(false);
  }, [visible]);

  const peek = links.slice(0, PEEK_COUNT);

  /**
   * Fanen henger i hjørnet sitt og svinger rundt det: i ro står den rett, i
   * fart vipper den ut mot kanten, åpen retter den seg opp og trekker inn.
   */
  const anchor = !visible
    ? "translateX(96px) rotate(6deg)"
    : open
      ? "translateX(-12px) rotate(0deg)"
      : scrolling
        ? "translateX(18px) rotate(7deg)"
        : "translateX(6px) rotate(0deg)";

  const pop = reduceMotion ? { duration: 0.18, ease: EASE_SOFT } : POP;
  const tilt = reduceMotion ? { duration: 0.2, ease: EASE_SOFT } : TILT;

  if (links.length === 0) return null;

  return (
    <div
      ref={containerRef}
      // Øyehøyde langs høyrekanten, ikke nede i hjørnet.
      className="pointer-events-none fixed right-0 bottom-[24vh] z-50"
    >
      <motion.div
        initial={false}
        // Nullstor boks: begge flatene forankres i dette punktet, og rotasjonen
        // svinger rundt det i stedet for rundt et flatesenter.
        className="relative"
        style={{ transformOrigin: "100% 100%" }}
        animate={{
          transform: reduceMotion
            ? `translateX(${visible ? (open ? -12 : 6) : 96}px)`
            : anchor,
          opacity: visible ? 1 : 0,
        }}
        transition={tilt}
      >
        {/* Mykt fargeskjær bak flatene. Ligger utenfor dem, så det aldri
            tvinger fram ny maling av selve glasset. */}
        <motion.span
          aria-hidden="true"
          className="-z-10 pointer-events-none absolute right-0 bottom-0 size-40 origin-bottom-right rounded-full bg-primary/25 blur-3xl"
          animate={{
            opacity: open ? 0.7 : 0.35,
            transform: `scale(${open ? 1.35 : 0.7})`,
          }}
          transition={pop}
        />

        {/* Begge flatene er absolutt plassert i samme hjørne, så de kan ligge
            oppå hverandre og krysse — ingen «wait», ingen layout-hopp. */}
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              ref={panelRef}
              key="panel"
              id={panelId}
              // Vokser ut fra hjørnet den kom fra, og trekker seg inn samme vei.
              style={{
                borderRadius: BLOB_PANEL,
                transformOrigin: "100% 100%",
                pointerEvents: visible ? "auto" : "none",
              }}
              initial={{
                opacity: 0,
                transform: reduceMotion ? "scale(1)" : "scale(0.86)",
              }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{
                opacity: 0,
                transform: reduceMotion ? "scale(1)" : "scale(0.9)",
              }}
              transition={pop}
              className={cn(
                "absolute right-0 bottom-0 w-[min(17.5rem,calc(100vw-1.5rem))] p-2.5",
                "bg-card/80 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)] ring-1 ring-border/50 backdrop-blur-2xl",
                "supports-backdrop-filter:bg-card/60"
              )}
            >
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="font-medium text-muted-foreground text-xs">
                  Følg
                </span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Lukk sosiale kanaler"
                  className="-mr-1 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                          : { opacity: 0, transform: "translateX(12px)" }
                      }
                      animate={{ opacity: 1, transform: "translateX(0px)" }}
                      transition={{
                        duration: 0.24,
                        ease: EASE_SOFT,
                        // Radene sklir inn fra kanten, 35 ms mellom hver.
                        delay: reduceMotion ? 0 : 0.035 * index,
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
          ) : (
            <motion.button
              ref={triggerRef}
              key="tab"
              type="button"
              onClick={() => {
                restoreFocus.current = false;
                setOpen(true);
              }}
              aria-expanded={false}
              aria-controls={panelId}
              aria-label="Følg oss i sosiale kanaler"
              style={{
                borderRadius: BLOB_TAB,
                transformOrigin: "100% 100%",
                pointerEvents: visible ? "auto" : "none",
              }}
              initial={{
                opacity: 0,
                transform: reduceMotion ? "scale(1)" : "scale(0.88)",
              }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{
                opacity: 0,
                transform: reduceMotion ? "scale(1)" : "scale(0.88)",
              }}
              transition={pop}
              whileTap={reduceMotion ? undefined : { transform: "scale(0.94)" }}
              className={cn(
                "absolute right-0 bottom-0 flex flex-col items-center gap-0 py-2.5 pr-3.5 pl-2.5",
                "bg-card/80 shadow-[0_18px_45px_-18px_rgb(0_0_0/0.45)] ring-1 ring-border/50 backdrop-blur-2xl",
                "supports-backdrop-filter:bg-card/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              {/* Merkene i stedet for et plusstegn: man ser med én gang hva
                  fanen inneholder. De overlapper som en avatarstabel. */}
              {peek.map((link, index) => (
                <span
                  key={link.platform}
                  aria-hidden="true"
                  style={
                    {
                      "--brand": socialColor(link.platform),
                      zIndex: peek.length - index,
                    } as React.CSSProperties
                  }
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    "bg-card text-(--brand) ring-2 ring-card",
                    index > 0 && "-mt-2.5"
                  )}
                >
                  <SocialIcon platform={link.platform} className="size-4" />
                </span>
              ))}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
