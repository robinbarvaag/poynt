"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { ConfettiBurst } from "./confetti-burst";

export type EventTicketStatus =
  | "registered"
  | "waitlisted"
  | "checked_in"
  | "cancelled";

export interface EventTicketProps {
  eventTitle: string;
  /** Ferdig formatert tidspunkt. */
  when: string;
  where?: string;
  name?: string;
  /** «POY-7K3M» — utelates når eventet ikke bruker billetter. */
  code?: string | null;
  /** SVG-markup for QR-koden (generert på serveren). */
  qrSvg?: string | null;
  status: EventTicketStatus;
  waitlistPosition?: number | null;
  /**
   * Spill av «rives av»-animasjonen når status blir `checked_in` (billettsiden
   * står åpen i det personen skannes). Uten denne vises bare slutt-tilstanden.
   */
  celebrate?: boolean;
  /** Knapper/lenker under billetten. */
  children?: ReactNode;
  className?: string;
}

const STATUS = {
  registered: { label: "Påmeldt", className: "bg-accent-3 text-foreground" },
  waitlisted: { label: "Venteliste", className: "bg-accent-1 text-foreground" },
  checked_in: {
    label: "Sjekket inn",
    className: "bg-primary-foreground text-primary",
  },
  cancelled: { label: "Avmeldt", className: "bg-muted text-muted-foreground" },
} as const;

const TEETH = 24;
const TOOTH_DEPTH = "9px";
/** Når rivingen skjer etter at animasjonen starter (etter et lite «napp»). */
const TEAR_DELAY_S = 0.38;

/**
 * Kanten langs perforeringen: rett (hel billett) eller takket (revet). Samme
 * antall punkter i begge, så `clip-path` kan animeres. Tennene på stumpen og
 * resten av billetten passer i hverandre, som en ekte revet billett.
 */
function perforationEdge(edge: "top" | "bottom", torn: boolean) {
  const points = Array.from({ length: TEETH + 1 }, (_, i) => {
    const x = `${(i / TEETH) * 100}%`;
    if (edge === "bottom") {
      const notch = torn && i % 2 === 1;
      return `${x} ${notch ? `calc(100% - ${TOOTH_DEPTH})` : "100%"}`;
    }
    const notch = torn && i % 2 === 0;
    return `${x} ${notch ? TOOTH_DEPTH : "0%"}`;
  });
  return edge === "bottom"
    ? `polygon(0% 0%, 100% 0%, ${points.reverse().join(", ")})`
    : `polygon(${points.join(", ")}, 100% 100%, 0% 100%)`;
}

/**
 * Billetten: en ekte billett-form med perforert kant mellom eventet og
 * QR-koden. Når personen er sjekket inn, er stumpen revet av langs
 * perforeringen og billetten har fått et stempel. Avmeldte billetter tones ned
 * og får et stempel, så ingen tror de fortsatt gjelder.
 */
export function EventTicket({
  eventTitle,
  when,
  where,
  name,
  code,
  qrSvg,
  status,
  waitlistPosition,
  celebrate,
  children,
  className,
}: EventTicketProps) {
  const statusInfo = STATUS[status];
  const inactive = status === "cancelled";
  const torn = status === "checked_in";
  const showQr = Boolean(qrSvg) && status !== "waitlisted" && !inactive;
  const reduceMotion = useReducedMotion();
  const animate = Boolean(celebrate) && !reduceMotion;
  const edgeTransition = animate
    ? `clip-path 180ms ease-out ${TEAR_DELAY_S * 1000}ms`
    : undefined;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-md",
        inactive && "opacity-70 grayscale",
        className
      )}
    >
      {/* Stumpen: eventet. Nappes litt, rives av og blir liggende på skrå. */}
      <motion.div
        className="relative z-10 drop-shadow-lg"
        style={{ transformOrigin: "90% 100%" }}
        animate={
          torn
            ? {
                x: -4,
                y: -18,
                rotate: animate ? [0, -1.5, 1.5, -3] : -3,
              }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={
          animate
            ? {
                rotate: {
                  duration: 0.9,
                  times: [0, 0.18, 0.36, 1],
                  ease: "easeOut",
                },
                default: {
                  type: "spring",
                  stiffness: 240,
                  damping: 14,
                  delay: TEAR_DELAY_S,
                },
              }
            : { duration: 0 }
        }
      >
        <div
          className="relative rounded-t-[2rem] bg-primary px-5 pt-5 pb-6 text-primary-foreground sm:px-7 sm:pt-7 sm:pb-8"
          style={{
            clipPath: perforationEdge("bottom", torn),
            transition: edgeTransition,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-primary-foreground/70 text-xs uppercase tracking-[0.16em]">
              Billett
            </span>
            <span
              className={cn(
                "rounded-full px-3 py-1 font-semibold text-xs",
                statusInfo.className
              )}
            >
              {statusInfo.label}
              {status === "waitlisted" && waitlistPosition
                ? ` · nr. ${waitlistPosition}`
                : ""}
            </span>
          </div>
          <p className="mt-3 text-balance font-bold font-heading text-xl leading-tight sm:mt-4 sm:text-2xl">
            {eventTitle}
          </p>
          <p className="mt-2 text-primary-foreground/85 text-sm leading-relaxed sm:mt-3">
            {when}
            {where ? (
              <>
                <br />
                {where}
              </>
            ) : null}
          </p>
          <PerforationNotches side="bottom" hidden={torn} />
        </div>
      </motion.div>

      {/* Resten av billetten: navn, QR og kode. */}
      <motion.div
        className="relative drop-shadow-xl"
        animate={torn && animate ? { y: [0, 6, 0] } : { y: 0 }}
        transition={
          animate
            ? { duration: 0.45, delay: TEAR_DELAY_S, ease: "easeOut" }
            : { duration: 0 }
        }
      >
        <div
          className="relative rounded-b-[2rem] border border-border border-t-0 bg-card px-5 pt-6 pb-5 text-center sm:px-7 sm:pt-8 sm:pb-7"
          style={{
            clipPath: perforationEdge("top", torn),
            transition: edgeTransition,
          }}
        >
          <PerforationNotches side="top" hidden={torn} />
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-6 top-0 border-border border-t-2 border-dashed transition-opacity duration-150",
              torn && "opacity-0"
            )}
          />

          {name && (
            <p className="text-muted-foreground text-sm">
              Til <span className="font-semibold text-foreground">{name}</span>
            </p>
          )}
          {showQr && qrSvg && (
            <div
              className={cn(
                "mx-auto mt-3 aspect-square w-44 rounded-2xl bg-white p-2 transition-opacity duration-700 sm:mt-4 sm:w-52 [&>svg]:h-full [&>svg]:w-full",
                torn && "opacity-40"
              )}
              role="img"
              aria-label={code ? `QR-kode for billett ${code}` : "QR-kode"}
              // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG generert av qrcode-biblioteket på serveren, ikke brukerinnhold
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          )}
          {code && !inactive && status !== "waitlisted" && (
            <p className="mt-3 font-bold font-mono text-2xl text-primary tracking-[0.14em] sm:mt-4 sm:text-3xl">
              {code}
            </p>
          )}
          {status === "waitlisted" && (
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              Får du plass, dukker QR-koden opp her, og du får den på e-post.
            </p>
          )}
          {children && <div className="mt-4 space-y-3 sm:mt-6">{children}</div>}
        </div>

        {torn && (
          <motion.span
            aria-hidden="true"
            initial={animate ? { scale: 2.2, opacity: 0, rotate: -26 } : false}
            animate={{ scale: 1, opacity: 1, rotate: -12 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 17,
              delay: TEAR_DELAY_S + 0.3,
            }}
            className="pointer-events-none absolute top-20 right-3 rounded-xl sm:top-28 border-4 border-primary bg-card/70 px-3 py-0.5 font-bold font-heading text-lg text-primary uppercase tracking-widest"
          >
            Sjekket inn
          </motion.span>
        )}
        {torn && animate && <ConfettiBurst />}
      </motion.div>

      {inactive && (
        <span
          aria-hidden="true"
          className="-rotate-12 pointer-events-none absolute top-1/3 left-1/2 z-20 -translate-x-1/2 rounded-xl border-4 border-destructive/70 px-4 py-1 font-bold font-heading text-3xl text-destructive/80 uppercase tracking-widest"
        >
          Avmeldt
        </span>
      )}
    </div>
  );
}

/** Halvsirklene i hver ende av perforeringen. Forsvinner når billetten er revet. */
function PerforationNotches({
  side,
  hidden,
}: {
  side: "top" | "bottom";
  hidden: boolean;
}) {
  const position =
    side === "top" ? "top-0 -translate-y-1/2" : "bottom-0 translate-y-1/2";
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "-left-4 absolute size-8 rounded-full bg-background transition-opacity duration-150",
          position,
          hidden && "opacity-0"
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "-right-4 absolute size-8 rounded-full bg-background transition-opacity duration-150",
          position,
          hidden && "opacity-0"
        )}
      />
    </>
  );
}
