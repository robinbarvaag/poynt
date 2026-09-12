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

/** Forsinket innholds-fade inni panelet (etter at morphen har «landet»). */
export function PanelFade({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="flex-1 overflow-y-auto p-8 md:p-10"
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

export interface ShowcaseModalProps {
  /**
   * Kalles ETTER at exit-animasjonen er ferdig — typisk `router.back()` når
   * modalet rendres via en intercepting-route.
   */
  onClosed: () => void;
  ariaLabel: string;
  /** Media-slot øverst (f.eks. next/image med fill). Placeholder uten. */
  image?: React.ReactNode;
  /** Overstyr bildeformatet, default `aspect-video`. */
  imageClassName?: string;
  /**
   * Delt layout-id (framer-motion): finnes et element med samme id på siden
   * under, morpher modalet ut fra det; ellers faller det tilbake til fade.
   */
  layoutId?: string;
  /** Ekstra klasser på selve panelet, f.eks. `max-w-xl`. */
  className?: string;
  children: React.ReactNode;
}

/**
 * Det felles modal-skallet for intercepting-modaler på nettsiden: grønntonet
 * blur-bakteppe, kort-flate med bilde øverst, rund lukkeknapp og forsinket
 * innholds-fade. Lukking (Esc, X, klikk utenfor) animerer ut lokalt før
 * `onClosed` varsles, siden ruten ellers ville unmountet modalet uten
 * exit-animasjon. Brukes av både tjeneste- og kontaktmodalet, så de oppleves
 * som ett system.
 */
export function ShowcaseModal({
  onClosed,
  ariaLabel,
  image,
  imageClassName,
  layoutId,
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
  const close = () => {
    setOpen(false);
    setClosing(true);
  };

  // Next 16 (cacheComponents) unmounter ikke ruten når man navigerer bort —
  // den skjules med React `<Activity>`, så komponenten (og `open: false`) lever
  // videre. Uten denne ville modalet aldri åpnet seg igjen etter første
  // lukking. Effekter kjøres på nytt når Activity viser ruten igjen, så vi
  // åpner alltid modalet når det blir synlig.
  useEffect(() => {
    setOpen(true);
    setClosing(false);
    pathRef.current = window.location.pathname;
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

  return (
    <>
      {/* `router.back()` er asynkron. Uten dette laget kunne et klikk på et
          nytt kort rekke å navigere før tilbake-steget landet — da spiste
          `back()` den nye navigasjonen, og man fikk feil tjeneste i modalet
          (eller feil URL). Laget forsvinner når ruten skjules. */}
      {closing && !open && (
        <div aria-hidden="true" className="fixed inset-0 z-50" />
      )}
      <AnimatePresence onExitComplete={handleExitComplete}>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.button
              type="button"
              aria-label="Lukk"
              onClick={close}
              className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.dialog
              open
              layoutId={layoutId}
              initial={reduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "relative z-10 m-0 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-4xl border-0 bg-card p-0 text-foreground shadow-2xl ring-1 ring-foreground/10",
                className
              )}
              aria-label={ariaLabel}
            >
              <ImageFrame
                image={image}
                className={cn("aspect-video shrink-0", imageClassName)}
              />
              <button
                type="button"
                onClick={close}
                aria-label="Lukk"
                className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md ring-1 ring-foreground/10 transition-colors hover:bg-background"
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
