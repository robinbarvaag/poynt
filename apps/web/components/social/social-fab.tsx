"use client";

import { cn } from "@poynt/ui";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
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

type Mode = "hidden" | "rest" | "peek" | "open";

interface Shape {
  /** Hvor langt formen stikker inn fra høyrekanten (px). */
  w: number;
  /** Høyden på kroppen, uten overgangene mot kanten (px). */
  h: number;
  /** Høyden på skuldrene øverst og nederst (px). */
  ry: number;
  /** Hvor dypt midjene mellom ikonene snører inn (px). 0 = rett side. */
  wave: number;
  /** Vipp: toppen trekkes ut, bunnen inn. 0 = rett. */
  lean: number;
  /** 0 = panel med vanlige hjørner, 1 = dråpe med skuldre helt inn. */
  round: number;
}

/** Tegneflaten. Formen tegnes inni den, festet til høyrekanten. */
const BOX_W = 300;
const ROW_H = 48;
const HEADER_H = 58;
const PANEL_PAD = 14;
const ICON = 36;
/** Avstand fra radens venstrekant til ikonsenteret. */
const ICON_CX = 6 + ICON / 2;
const PEEK_COUNT = 3;
/** Plass over og under kroppen til overgangene mot kanten. */
const FILLET_ROOM = 48;
/** Tid etter siste scroll-piksel før formen trekker seg tilbake. */
const SETTLE_MS = 450;

/**
 * Én fjær for både formen og ikonene, så de beveger seg som ett legeme.
 * Dempingsgrad ≈ 1: den glir på plass uten etterslag.
 */
const SPRING = { stiffness: 220, damping: 30, mass: 1 } as const;
const SPRING_REDUCED = { stiffness: 600, damping: 70, mass: 1 } as const;

/** Hvor tydelig hvert ikon i stabelen er. Nederste ikon toner ut. */
const STACK_FADE: Record<"rest" | "peek", number[]> = {
  rest: [0.85, 0.65, 0.45],
  peek: [1, 0.85, 0.7],
};

/**
 * Størrelser på den lukkede formen. På mobil er den smalere, så den stikker
 * kortere inn over teksten.
 */
const CLOSED = {
  wide: {
    rest: { w: 52, ry: 24, spacing: 36, scale: 0.8 },
    peek: { w: 68, ry: 30, spacing: 42, scale: 0.95 },
  },
  narrow: {
    rest: { w: 38, ry: 18, spacing: 30, scale: 0.66 },
    peek: { w: 48, ry: 22, spacing: 34, scale: 0.76 },
  },
} as const;

/** Hvor langt ned på skjermen formen sitter (prosent av høyden). */
const ANCHOR_SVH = 78;

/** Under denne bredden (px) brukes de smale størrelsene. */
const NARROW_BELOW = 640;

/**
 * Banen for formen. Den er festet til høyrekanten (x = W):
 *
 * 1. en innadbuet overgang fra kanten,
 * 2. en skulder ned til første bue,
 * 3. tre svake buer — én per ikon — med slake midjer mellom seg,
 * 4. en skulder og en innadbuet overgang tilbake til kanten.
 *
 * Buene er det som gjør formen levende: den ser ut som tre dråper som har
 * flytt sammen. Som panel er midjene 0 og sidene rette.
 *
 * Hvert toppunkt og hver midje har loddrett tangent, og hvert segment finnes i
 * alle tilstander, så banen interpoleres uten knekk.
 */
function blobPath(W: number, H: number, s: Shape) {
  const cy = H / 2;
  const top = cy - s.h / 2;
  const bottom = cy + s.h / 2;
  // Lange, slake overganger: formen glir ut av kanten i stedet for å knekke.
  const f = Math.max(0, Math.min(40, s.w * 0.5, s.h * 0.28));
  // Litt større overgang øverst enn nederst — ingen perfekt symmetri.
  const ft = f * 1.1;
  const fb = f * 0.9;
  const ry = Math.max(0, Math.min(s.ry, s.h / 2 - 1));
  const cap = 46 + 400 * s.round;
  const rxTop = Math.max(0, Math.min(s.w + s.lean - ft, cap));
  const rxBot = Math.max(0, Math.min(s.w - s.lean - fb, cap));

  // Toppunktene for de tre buene. Vippen skyver den øverste ut.
  const xTop = W - s.w - s.lean;
  const xMid = W - s.w;
  const xBot = W - s.w + s.lean;
  const waist = Math.max(0, Math.min(s.wave, (s.w - ft) * 0.45));
  const xW1 = (xTop + xMid) / 2 + waist;
  const xW2 = (xMid + xBot) / 2 + waist;

  const yA = top + ry;
  const yB = bottom - ry;
  const yM = (yA + yB) / 2;
  const yW1 = (yA + yM) / 2;
  const yW2 = (yM + yB) / 2;
  // Håndtakslengde for S-kurvene mellom toppunkt og midje.
  const q = (yB - yA) * 0.25 * 0.7;
  const k = 0.45;

  return [
    `M${W} ${top - ft}`,
    `C${W} ${top - ft * 0.5} ${W - ft * 0.5} ${top} ${W - ft} ${top}`,
    `L${xTop + rxTop} ${top}`,
    `C${xTop + rxTop * k} ${top} ${xTop} ${top + ry * k} ${xTop} ${yA}`,
    `C${xTop} ${yA + q} ${xW1} ${yW1 - q} ${xW1} ${yW1}`,
    `C${xW1} ${yW1 + q} ${xMid} ${yM - q} ${xMid} ${yM}`,
    `C${xMid} ${yM + q} ${xW2} ${yW2 - q} ${xW2} ${yW2}`,
    `C${xW2} ${yW2 + q} ${xBot} ${yB - q} ${xBot} ${yB}`,
    `C${xBot} ${yB + ry * k} ${xBot + rxBot * k} ${bottom} ${xBot + rxBot} ${bottom}`,
    `L${W - fb} ${bottom}`,
    `C${W - fb * 0.5} ${bottom} ${W} ${bottom + fb * 0.5} ${W} ${bottom + fb}`,
    "Z",
  ].join(" ");
}

function shapeFor(
  mode: Mode,
  linkCount: number,
  openW: number,
  narrow: boolean
): Shape {
  if (mode === "open") {
    return {
      w: openW,
      h: HEADER_H + linkCount * ROW_H + PANEL_PAD,
      ry: 46,
      wave: 0,
      lean: 0,
      round: 0,
    };
  }
  const size =
    CLOSED[narrow ? "narrow" : "wide"][mode === "peek" ? "peek" : "rest"];
  return {
    w: mode === "hidden" ? 0 : size.w,
    h: size.ry * 2 + size.spacing * 2,
    ry: size.ry,
    wave: 0,
    lean: 0,
    round: 1,
  };
}

/**
 * Organisk form som vokser ut av høyrekanten — samme grep som Instagram.
 *
 * - **I ro** stikker en myk, grønn form fram med kanalikonene.
 * - **Når man scroller** (eller holder pekeren over) vokser den rolig ut.
 * - **Ved trykk** flyter buene sammen til et panel med alle kanalene, og
 *   ikonene glir fra stabelen ut i hver sin rad.
 *
 * **Ytelse.** Formen er én SVG-bane uten filter eller uskarphet. Fjærene
 * skriver rett til `d`-attributtet og til `transform` på ikonene, forbi React,
 * så ingenting rendres på nytt per frame og ingenting utløser layout.
 */
export function SocialFab({
  links,
  hideNearSelector = "#site-footer",
}: SocialFabProps) {
  const [open, setOpen] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [openW, setOpenW] = useState(272);
  const [narrow, setNarrow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Skiller «lukket av bruker» fra «lukket fordi formen forsvant», så vi ikke
  // river fokus tilbake til en knapp som ikke lenger er synlig.
  const restoreFocus = useRef(false);
  const panelId = useId();
  const reduceMotion = useReducedMotion() ?? false;

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
    const onResize = () => {
      setOpenW(Math.min(272, window.innerWidth - 16));
      setNarrow(window.innerWidth < NARROW_BELOW);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  useEffect(() => {
    if (open) {
      listRef.current?.querySelector<HTMLElement>("a")?.focus();
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

  const mode: Mode = !visible
    ? "hidden"
    : open
      ? "open"
      : scrolling || hovering
        ? "peek"
        : "rest";

  const count = links.length;
  const panelH = HEADER_H + count * ROW_H + PANEL_PAD;
  const boxH =
    Math.max(panelH, CLOSED.wide.peek.ry * 2 + CLOSED.wide.peek.spacing * 2) +
    FILLET_ROOM * 2;
  const cy = boxH / 2;
  const shape = shapeFor(mode, count, openW, narrow);
  const spring = reduceMotion ? SPRING_REDUCED : SPRING;

  const w = useSpring(shape.w, spring);
  const h = useSpring(shape.h, spring);
  const ry = useSpring(shape.ry, spring);
  const wave = useSpring(shape.wave, spring);
  const lean = useSpring(shape.lean, spring);
  const round = useSpring(shape.round, spring);

  useEffect(() => {
    w.set(shape.w);
    h.set(shape.h);
    ry.set(shape.ry);
    wave.set(shape.wave);
    lean.set(shape.lean);
    round.set(shape.round);
  }, [w, h, ry, wave, lean, round, shape]);

  const d = useTransform(
    [w, h, ry, wave, lean, round],
    ([wv, hv, ryv, wav, lv, rv]) =>
      blobPath(BOX_W, boxH, {
        w: wv as number,
        h: hv as number,
        ry: ryv as number,
        wave: wav as number,
        lean: lv as number,
        round: rv as number,
      })
  );

  if (count === 0) return null;

  const stack = Math.min(PEEK_COUNT, count);
  const panelLeft = BOX_W - openW;
  const panelTop = cy - panelH / 2;

  /** Hvor rad nr. `index` skal stå, og hvor synlig ikonet er. */
  function rowTarget(index: number) {
    if (mode === "open") {
      return {
        x: panelLeft + PANEL_PAD,
        y: panelTop + HEADER_H + index * ROW_H,
        scale: 1,
        opacity: 1,
      };
    }
    // Ikoner utenfor stabelen gjemmer seg bak det nederste.
    const slot = Math.min(index, stack - 1);
    const t = stack > 1 ? slot / (stack - 1) : 0.5;
    const size =
      CLOSED[narrow ? "narrow" : "wide"][mode === "peek" ? "peek" : "rest"];
    const spacing = size.spacing;
    const centerY = cy + (slot - (stack - 1) / 2) * spacing;
    // Hvert ikon står midt i sin egen bue, som følger vippen.
    const leanOffset = shape.lean * (1 - 2 * t);
    const centerX = BOX_W - (Math.max(shape.w, 24) + leanOffset) / 2;
    const fade =
      mode === "hidden" || index >= stack ? 0 : (STACK_FADE[mode][slot] ?? 0);
    return {
      x: centerX - ICON_CX,
      y: centerY - ROW_H / 2,
      scale: size.scale,
      opacity: fade,
    };
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed right-0 z-50 -translate-y-1/2"
      style={{
        width: BOX_W,
        height: boxH,
        // Lavt på siden, der den er i veien for minst mulig tekst. Taket sørger
        // for at det åpne panelet aldri går ut under skjermkanten.
        top: `min(${ANCHOR_SVH}svh, calc(100svh - ${panelH / 2 + 56}px))`,
      }}
    >
      <svg
        aria-hidden="true"
        width={BOX_W}
        height={boxH}
        viewBox={`0 0 ${BOX_W} ${boxH}`}
        // Én piksel ut over kanten, så streken langs kanten ikke synes.
        className="absolute top-0 -right-px overflow-visible"
      >
        <motion.path
          d={d}
          className="fill-card stroke-border"
          strokeWidth={1}
          // Bare den malte formen fanger klikk — ikke den tomme tegneflaten.
          style={{ pointerEvents: open ? "visiblePainted" : "none" }}
        />
      </svg>

      {/* Toppen av panelet: tittel og lukkeknapp. Innrykket følger den store
          radien i hjørnet, så teksten ikke kolliderer med kurven. */}
      <motion.div
        id={panelId}
        aria-hidden={!open}
        className="absolute flex items-center justify-between"
        style={{
          left: panelLeft,
          top: panelTop,
          width: openW,
          height: HEADER_H,
          paddingLeft: 30,
          paddingRight: 18,
          paddingTop: 6,
          pointerEvents: open ? "auto" : "none",
        }}
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{
          duration: open ? 0.22 : 0.1,
          delay: open ? 0.08 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <span className="font-medium text-muted-foreground text-xs">Følg</span>
        <button
          type="button"
          onClick={close}
          tabIndex={open ? 0 : -1}
          aria-label="Lukk sosiale kanaler"
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 ease-out hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
      </motion.div>

      <ul ref={listRef} inert={!open} aria-label="Sosiale kanaler">
        {links.map((link, index) => {
          const label = socialLabel(link.platform);
          const target = rowTarget(index);
          return (
            <motion.li
              key={link.platform}
              className="absolute top-0 left-0"
              style={{
                width: openW - PANEL_PAD * 2,
                height: ROW_H,
                transformOrigin: `${ICON_CX}px 50%`,
                pointerEvents: open ? "auto" : "none",
              }}
              initial={false}
              animate={{
                transform: `translate(${target.x}px, ${target.y}px) scale(${target.scale})`,
                opacity: target.opacity,
              }}
              transition={{
                type: "spring",
                ...spring,
                // Radene løsner fra stabelen én og én på vei ut.
                delay: open && !reduceMotion ? index * 0.018 : 0,
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
                  "group flex size-full items-center gap-3 rounded-full pr-3 pl-1.5",
                  "transition-colors duration-200 ease-out",
                  "hover:bg-foreground/4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full",
                    "bg-(--brand)/10 text-(--brand)",
                    "transition-transform duration-200 ease-out",
                    "motion-safe:group-active:scale-95"
                  )}
                >
                  <SocialIcon platform={link.platform} className="size-4.5" />
                </span>
                <motion.span
                  className="font-medium text-foreground text-sm"
                  initial={false}
                  animate={{
                    opacity: open ? 1 : 0,
                    transform: `translateX(${open || reduceMotion ? 0 : -8}px)`,
                  }}
                  transition={{
                    duration: open ? 0.22 : 0.08,
                    delay: open ? 0.1 + index * 0.02 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {label}
                </motion.span>
              </a>
            </motion.li>
          );
        })}
      </ul>

      {/* Treffflaten for den lukkede formen. Litt større enn det synlige, så
          den er lett å treffe med tommelen. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          restoreFocus.current = false;
          setOpen(true);
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovering(true);
        }}
        onPointerLeave={() => setHovering(false)}
        tabIndex={open || !visible ? -1 : 0}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Følg oss i sosiale kanaler"
        className="absolute right-0 rounded-l-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{
          top: cy - 100,
          width: 84,
          height: 200,
          pointerEvents: open || !visible ? "none" : "auto",
        }}
      />
    </div>
  );
}
