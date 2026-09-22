import { ESTIMATE, HATCH_ID } from "./chart-tokens";

/**
 * Skravur for estimerte tall. Legges som `<defs>` inne i en Recharts-graf og
 * brukes med `fill="url(#boksalg-hatch)"`. Basen er estimat-fargen med hvite
 * diagonale striper, så et estimat skiller seg fra et eksakt tall også uten
 * farge — i svart-hvitt, for fargeblinde, på utskrift.
 */
export function HatchPattern() {
  return (
    <defs>
      <pattern
        id={HATCH_ID}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="6" height="6" fill={ESTIMATE} />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2="6"
          stroke="#ffffff"
          strokeWidth="2.5"
          opacity="0.55"
        />
      </pattern>
    </defs>
  );
}
