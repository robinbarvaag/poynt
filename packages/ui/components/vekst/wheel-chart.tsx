"use client";

import { cn } from "../../lib/utils";
import { ringsForYes } from "./logic";
import { WHEEL_RINGS } from "./palette";

export interface WheelSegment {
  /** Navnet på området. Brukes i skjermlesertekst. */
  label: string;
  /** Ett svar per spørsmål: `true` = ja, `false` = nei, `null` = ubesvart. */
  answers: (boolean | null)[];
  /** Hvor mange ringer som er fylt (0–3), fra `ringsForYes`. */
  rings: number;
}

export interface WheelChartProps {
  segments: WheelSegment[];
  /** Området som fylles ut nå, eller −1. Får mørkt nummer. */
  activeIndex?: number;
  /** Området leseren bør starte med, eller −1. Får ramme rundt seg. */
  focusIndex?: number;
  label: string;
  className?: string;
}

// Hjulet tegnes i et fast koordinatsystem og skaleres av viewBox.
const SIZE = 320;
const C = SIZE / 2;
/** Ytterkanten av hjulet, og de to ringgrensene innenfor. Som i boka er den
 *  grønne midten størst, så den gule ringen, så en smalere lilla ytterring. */
const R_OUTER = 132;
const RADII = [R_OUTER, R_OUTER * 0.72, R_OUTER * 0.42];
/** Lite hull i midten så mellomrommene mellom områdene ikke møtes i et punkt. */
const R_HOLE = 11;
/** Svarstrekene ligger like utenfor kanten, ett per spørsmål. */
const R_TICKS = 145;
/** Nummeret til området står inne i den ytterste ringen. */
const R_LABEL = (RADII[0] + RADII[1]) / 2;
/** Halve bredden på det hvite mellomrommet mellom områdene. */
const GAP = 2.5;

function polar(r: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

const f = (n: number) => n.toFixed(2);

/**
 * Vinkelen et punkt må flyttes for å ligge `GAP` unna delelinja. Gir like
 * brede mellomrom hele veien inn, i stedet for kiler som smalner mot midten.
 */
function inset(r: number) {
  return (Math.asin(Math.min(0.999, GAP / r)) * 180) / Math.PI;
}

/** Ringbit: fra `rInner` til `rOuter` innenfor vinkelutsnittet. */
function ringSector(
  rInner: number,
  rOuter: number,
  from: number,
  to: number
): string {
  const outFrom = from + inset(rOuter);
  const outTo = to - inset(rOuter);
  const inFrom = from + inset(rInner);
  const inTo = to - inset(rInner);
  const large = outTo - outFrom > 180 ? 1 : 0;
  const [x1, y1] = polar(rOuter, outFrom);
  const [x2, y2] = polar(rOuter, outTo);
  const [x3, y3] = polar(rInner, inTo);
  const [x4, y4] = polar(rInner, inFrom);
  return [
    `M${f(x1)} ${f(y1)}`,
    `A${f(rOuter)} ${f(rOuter)} 0 ${large} 1 ${f(x2)} ${f(y2)}`,
    `L${f(x3)} ${f(y3)}`,
    `A${f(rInner)} ${f(rInner)} 0 ${large} 0 ${f(x4)} ${f(y4)}`,
    "Z",
  ].join(" ");
}

function arc(r: number, from: number, to: number): string {
  const large = to - from > 180 ? 1 : 0;
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M${f(x1)} ${f(y1)} A${f(r)} ${f(r)} 0 ${large} 1 ${f(x2)} ${f(y2)}`;
}

/**
 * Farge på hvert svarstrek. Et ja får fargen til ringen det tegnet (første ja
 * lilla, andre gult, tredje grønt), et nei blir blekt, ubesvart nesten usynlig.
 */
function tickColors(segment: WheelSegment) {
  const total = segment.answers.length;
  let yes = 0;
  return segment.answers.map((answer) => {
    if (answer === null) return { color: "currentColor", opacity: 0.08 };
    if (answer === false) return { color: "currentColor", opacity: 0.2 };
    yes++;
    const ring = Math.min(
      WHEEL_RINGS.length - 1,
      Math.max(0, ringsForYes(yes, total) - 1)
    );
    return { color: WHEEL_RINGS[ring].color, opacity: 1 };
  });
}

/**
 * Endringshjulet slik det er tegnet i boka: områdene som kakestykker, hvert
 * delt i tre ringer. Hvert ja tegner én ring til, utenfra og inn, så et
 * område som er helt grønt i midten er et område du er god på. Strekene rundt
 * kanten er ett per spørsmål, så hvert trykk synes med en gang.
 */
export function WheelChart({
  segments,
  activeIndex = -1,
  focusIndex = -1,
  label,
  className,
}: WheelChartProps) {
  if (segments.length === 0) return null;

  const span = 360 / segments.length;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={label}
      className={cn("h-auto w-full text-foreground", className)}
    >
      {segments.map((segment, i) => {
        const from = i * span;
        const to = (i + 1) * span;
        const active = i === activeIndex;
        const focused = i === focusIndex;
        const [lx, ly] = polar(R_LABEL, from + span / 2);
        const tickSpan = span / segment.answers.length;

        return (
          <g key={segment.label}>
            {WHEEL_RINGS.map((ring, k) => {
              const filled = segment.rings > k;
              return (
                <path
                  key={ring.label}
                  d={ringSector(
                    k === WHEEL_RINGS.length - 1 ? R_HOLE : RADII[k + 1],
                    RADII[k],
                    from,
                    to
                  )}
                  fill={filled ? ring.color : "currentColor"}
                  fillOpacity={filled ? 1 : 0.04}
                  // Tynn strek på alle ringene, også de tomme: da ser leseren
                  // hele hjulet fra første blikk, slik det er tegnet i boka.
                  stroke="currentColor"
                  strokeOpacity={0.16}
                  style={{ transition: "fill 350ms, fill-opacity 350ms" }}
                />
              );
            })}

            {focused && (
              <path
                d={ringSector(R_HOLE, RADII[0], from, to)}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
              />
            )}

            {/* Ett strek per spørsmål rundt kanten. Et ja får fargen til
                ringen det tegnet, så kragen forteller hvor ringene kom fra. */}
            {tickColors(segment).map((tick, j) => (
              <path
                key={`${segment.label}-${j}`}
                d={arc(
                  R_TICKS,
                  from + j * tickSpan + 1.5,
                  from + (j + 1) * tickSpan - 1.5
                )}
                fill="none"
                stroke={tick.color}
                strokeOpacity={tick.opacity}
                strokeWidth={6}
                strokeLinecap="round"
                style={{ transition: "stroke 250ms, stroke-opacity 250ms" }}
              />
            ))}

            {active && <circle cx={lx} cy={ly} r={13} fill="currentColor" />}
            <text
              x={lx}
              y={ly + 4.5}
              textAnchor="middle"
              fontSize={13}
              fontWeight={700}
              fill={active ? "var(--color-card, #fff)" : "currentColor"}
              fillOpacity={active ? 1 : 0.55}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Liten utgave av hjulet til forklaringen: én sirkel per ring, fylt utenfra og
 * inn. Viser hva ett, to og tre ja betyr uten en eneste ordforklaring.
 */
export function WheelRingSwatch({
  rings,
  className,
}: {
  rings: number;
  className?: string;
}) {
  const radii = [13, 9, 5];
  return (
    <svg
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={cn("size-7 shrink-0 text-foreground", className)}
    >
      {WHEEL_RINGS.map((ring, k) => (
        <circle
          key={ring.label}
          cx={14}
          cy={14}
          r={radii[k]}
          fill={rings > k ? ring.color : "currentColor"}
          fillOpacity={rings > k ? 1 : 0.06}
          // Tynn strek mellom ringene, ellers smelter de sammen i småformat.
          stroke="currentColor"
          strokeOpacity={0.2}
        />
      ))}
    </svg>
  );
}
