"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import { cn } from "../../lib/utils";

export function CloseIcon() {
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

/**
 * Media-ramme; uten bilde vises merkevare-dekor (myke sirkler i
 * sekundærpaletten — samme språk som delingsbildene i /api/og-image), så det
 * aldri ser ut som et bilde «mangler».
 */
export function ImageFrame({
  image,
  className,
}: {
  image?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {image ?? (
        <div aria-hidden="true" className="size-full">
          <span className="absolute -top-[35%] -right-[8%] aspect-square w-[45%] rounded-full bg-accent-3/60" />
          <span className="absolute -bottom-[40%] right-[18%] aspect-square w-[32%] rounded-full bg-accent-2/45" />
          <span className="absolute right-[-5%] bottom-[12%] aspect-square w-[19%] rounded-full bg-accent-1/55" />
        </div>
      )}
    </div>
  );
}

/** Escape lukker, og body-scroll låses så lenge `active` er sann. */
export function useModalBehavior(active: boolean, onClose: () => void) {
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
}

/**
 * Innholdsflaten i panelet. Ingen egen inn-animasjon lenger: innholdet skal
 * stå der i samme øyeblikk som panelet lander, ellers oppleves modalet som
 * tomt et lite sekund. Innhold som streamer inn senere (rik tekst) fader
 * selv inn via `starting:`-varianten der det settes inn.
 */
export function PanelFade({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 overflow-y-auto p-8 md:p-10">{children}</div>;
}

/**
 * Sterk ease-out (starter raskt, lander mykt). Innebygde CSS-easinger er for
 * svake til at bevegelsen føles bevisst.
 */
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const ENTER = { duration: 0.24, ease: EASE_OUT } as const;
// Ut skal alltid gå raskere enn inn — brukeren har bestemt seg.
const EXIT = { duration: 0.15, ease: EASE_OUT } as const;

export interface ShowcaseModalProps {
  /**
   * Kalles ETTER at exit-animasjonen er ferdig — typisk `router.back()` når
   * modalet rendres via en intercepting-route.
   */
  onClosed: () => void;
  /** Kalles i det lukkingen starter (før exit-animasjonen). */
  onCloseStart?: () => void;
  /**
   * Klikket brukeren på en intern lenke (f.eks. et nytt kort) mens lukkingen
   * pågikk, kalles denne med lenkens `href` i det ruten er skjult — typisk
   * `router.push(href)`. Uten den svelges slike klikk.
   */
  onDeferredNavigate?: (href: string) => void;
  ariaLabel: string;
  /** Media-slot øverst (f.eks. next/image med fill). Placeholder uten. */
  image?: React.ReactNode;
  /** Overstyr bildeformatet, default 16:10. */
  imageClassName?: string;
  /**
   * Hopp over inn-animasjonen. Brukes når et skall allerede står på skjermen
   * (f.eks. en forhåndsvisning fra en Suspense-fallback) og dette modalet
   * bare tar over innholdet — da skal ingenting «poppe» på nytt.
   */
  skipEnter?: boolean;
  /** Ekstra klasser på selve panelet, f.eks. `max-w-xl`. */
  className?: string;
  children: React.ReactNode;
}

/**
 * Det felles modal-skallet for intercepting-modaler på nettsiden: grønntonet
 * bakteppe, kort-flate med bilde øverst, rund lukkeknapp. Lukking (Esc, X,
 * klikk utenfor) animerer ut lokalt før `onClosed` varsles, siden ruten
 * ellers ville unmountet modalet uten exit-animasjon. Brukes av både
 * tjeneste- og kontaktmodalet, så de oppleves som ett system.
 *
 * Bevegelse: kun `opacity` + `transform` (full transform-streng, så
 * framer-motion kan la nettleseren kjøre den utenfor hovedtråden). Ingen delt
 * layout-morph og ingen blur som animeres — begge deler dropper bilder når
 * hovedtråden samtidig laster rute-innhold, spesielt i Safari.
 */
export function ShowcaseModal({
  onClosed,
  onCloseStart,
  onDeferredNavigate,
  ariaLabel,
  image,
  imageClassName,
  skipEnter = false,
  className,
  children,
}: ShowcaseModalProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  // Sann fra lukking starter til ruten faktisk er navigert bort (og skjult).
  const [closing, setClosing] = useState(false);
  // Stien modalet ble vist på — `onClosed` (typisk `router.back()`) skal bare
  // kjøres hvis brukeren fortsatt står der.
  const pathRef = useRef<string | null>(null);
  // Lenke brukeren klikket på mens lukkingen pågikk (se laget under). Kjøres
  // når ruten er skjult — da har tilbake-steget landet, og en ny navigasjon
  // kan ikke lenger bli forkastet av det.
  const deferredHrefRef = useRef<string | null>(null);
  const closingRef = useRef(false);
  const onDeferredNavigateRef = useRef(onDeferredNavigate);
  onDeferredNavigateRef.current = onDeferredNavigate;
  const close = () => {
    onCloseStart?.();
    closingRef.current = true;
    setOpen(false);
    setClosing(true);
  };

  useEffect(
    () => () => {
      // Kjøres når Activity skjuler ruten (eller ved unmount).
      const href = deferredHrefRef.current;
      deferredHrefRef.current = null;
      if (href && closingRef.current) {
        closingRef.current = false;
        onDeferredNavigateRef.current?.(href);
      }
    },
    []
  );

  const captureDeferredClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Finn lenken som ligger under laget der brukeren klikket.
    const target = e.currentTarget;
    const anchor = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el !== target && !target.contains(el))
      ?.closest("a[href]");
    const href = anchor?.getAttribute("href");
    if (href?.startsWith("/")) {
      deferredHrefRef.current = href;
    }
  };

  // Next 16 (cacheComponents) unmounter ikke ruten når man navigerer bort —
  // den skjules med React `<Activity>`, så komponenten (og `open: false`) lever
  // videre. Uten denne ville modalet aldri åpnet seg igjen etter første
  // lukking. Effekter kjøres på nytt når Activity viser ruten igjen, så vi
  // åpner alltid modalet når det blir synlig.
  useEffect(() => {
    pathRef.current = window.location.pathname;
    setOpen(true);
    setClosing(false);
  }, []);

  useModalBehavior(open, close);

  const handleExitComplete = () => {
    // Har brukeren allerede navigert bort (f.eks. nettleserens tilbake-knapp
    // under exit-animasjonen), ville en ny `back()` hoppet ett steg for langt.
    if (window.location.pathname !== pathRef.current) {
      setClosing(false);
      return;
    }
    onClosed();
  };

  const panelInitial = skipEnter
    ? false
    : reduce
      ? { opacity: 0 }
      : { opacity: 0, transform: "scale(0.96) translateY(8px)" };

  return (
    <>
      {/* `router.back()` er asynkron. Uten dette laget kunne et klikk på et
          nytt kort rekke å navigere før tilbake-steget landet — Next forkaster
          da den påbegynte navigasjonen når popstate kommer, og man fikk feil
          tjeneste i modalet (eller feil URL). Laget forsvinner når ruten
          skjules. Klikket svelges ikke: lenken under noteres og navigeres til
          i det ruten er skjult (`onDeferredNavigate`). */}
      {closing && !open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: usynlig klikkfanger (aria-hidden), tastatur går ikke via dette laget
        <div
          aria-hidden="true"
          className="fixed inset-0 z-50"
          onClick={captureDeferredClick}
        />
      )}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.button
              type="button"
              aria-label="Lukk"
              onClick={close}
              className="absolute inset-0 bg-foreground/50"
              initial={skipEnter ? false : { opacity: 0 }}
              animate={{ opacity: 1, transition: ENTER }}
              exit={{ opacity: 0, transition: EXIT }}
            />
            <motion.dialog
              open
              initial={panelInitial}
              animate={{
                opacity: 1,
                transform: "scale(1) translateY(0px)",
                transition: ENTER,
              }}
              exit={{
                opacity: 0,
                transform: reduce
                  ? "scale(1) translateY(0px)"
                  : "scale(0.98) translateY(0px)",
                transition: EXIT,
              }}
              className={cn(
                "relative z-10 m-0 flex max-h-[88vh] w-full max-w-2xl origin-center flex-col overflow-hidden rounded-4xl border-0 bg-card p-0 text-foreground shadow-2xl ring-1 ring-foreground/10 will-change-[transform,opacity]",
                className
              )}
              aria-label={ariaLabel}
            >
              <ImageFrame
                image={image}
                // 16:10 framfor 16:9: litt mer høyde gjør at portretter ikke
                // mister toppen av hodet. Fokuspunktet på bildet styrer resten.
                className={cn("aspect-[16/10] shrink-0", imageClassName)}
              />
              <button
                type="button"
                onClick={close}
                aria-label="Lukk"
                className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-foreground/10 transition-[background-color,transform] duration-150 ease-out hover:bg-background motion-safe:active:scale-95"
              >
                <CloseIcon />
              </button>

              <PanelFade>{children}</PanelFade>
            </motion.dialog>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
