"use client";

import { useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";
import type { Zone } from "./logic";

export interface GaugeBand {
  from: number;
  to: number;
  zone: Zone;
}

export interface ZoneGaugeProps {
  value: number | null;
  min: number;
  max: number;
  bands: GaugeBand[];
  /** Tilgjengelig beskrivelse, f.eks. «Lønnsomhet: 37 %». */
  label: string;
  className?: string;
}

const CX = 120;
const CY = 120;
const R = 96;

function point(t: number): [number, number] {
  const angle = Math.PI * (1 - t);
  return [CX + R * Math.cos(angle), CY - R * Math.sin(angle)];
}

function arc(t1: number, t2: number): string {
  const [x1, y1] = point(t1);
  const [x2, y2] = point(t2);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Halvsirkel-måler med bokas fargesoner og en nål som svinger på plass med
 * litt sprett når verdien endres. Tekst og tall står i HTML ved siden av, så
 * måleren er ren grafikk.
 */
export function ZoneGauge({
  value,
  min,
  max,
  bands,
  label,
  className,
}: ZoneGaugeProps) {
  const reduceMotion = useReducedMotion();
  const position = (v: number) =>
    (Math.min(max, Math.max(min, v)) - min) / (max - min);
  const degrees = value === null ? -90 : position(value) * 180 - 90;

  return (
    <svg
      viewBox="0 0 240 132"
      role="img"
      aria-label={label}
      className={cn("h-auto w-full max-w-[17rem] overflow-visible", className)}
    >
      {bands.map((band) => (
        <path
          key={`${band.from}-${band.to}`}
          d={arc(position(band.from), position(band.to))}
          fill="none"
          stroke={`var(--vk-${band.zone})`}
          strokeWidth={22}
        />
      ))}
      <g
        style={{
          transform: `rotate(${degrees}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transformBox: "view-box",
          transition: reduceMotion
            ? "none"
            : "transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={36}
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </g>
      <circle cx={CX} cy={CY} r={9} fill="currentColor" />
    </svg>
  );
}
