"use client";

import type { DailyPoint } from "@/lib/boksalg/dashboard";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@poynt/ui";
import type { ComponentProps } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ESTIMATE, EXACT, HATCH_ID } from "./chart-tokens";
import { kortDag } from "./format";
import { HatchPattern } from "./hatch-pattern";

/**
 * Bøker dag for dag — solgt inn og ut av hyllene i samme graf, men som to
 * søyler ved siden av hverandre, aldri stablet.
 *
 * «Solgt inn» (bokhandelens innkjøp, avregninger, nettbutikken) og «ut av
 * hyllene» (utledet av at butikklageret gikk ned) er to stadier i samme reise,
 * ikke to deler av en sum. Stablet ville de blitt lest som et totaltall og de
 * samme bøkene talt to ganger. Side om side kan Susanne se det hun egentlig
 * lurer på: rører det seg litt hver dag, eller kommer alt i rykk? Derfor står
 * også de tomme dagene på aksen. Estimatet er skravert så usikkerheten leses
 * uten farge.
 */

/** Liten fylt rute — ikonet for eksakte tall i legende og tooltip. */
function ExactSwatch() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" width="12" height="12">
      <rect width="12" height="12" rx="2" fill={EXACT} />
    </svg>
  );
}

/** Samme rute skravert — ikonet for estimater. Egen pattern-id, så den
 *  virker utenfor grafens `<svg>` (legenden og tooltipen er egne elementer). */
function EstimateSwatch() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true" width="12" height="12">
      <defs>
        <pattern
          id="boksalg-hatch-swatch"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="4" height="4" fill={ESTIMATE} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="4"
            stroke="#ffffff"
            strokeWidth="1.6"
            opacity="0.55"
          />
        </pattern>
      </defs>
      <rect width="12" height="12" rx="2" fill="url(#boksalg-hatch-swatch)" />
    </svg>
  );
}

const config = {
  soldIn: { label: "Solgt inn", color: EXACT, icon: ExactSwatch },
  sellThrough: {
    label: "Ut av hyllene",
    color: ESTIMATE,
    icon: EstimateSwatch,
  },
} satisfies ChartConfig;

/**
 * Kapper y-aksen så den daglige bevegelsen synes.
 *
 * Et innkjøp på 300 bøker gjør en dag med 2 bøker ut av hylla til en strek
 * ved null. Aksen følger derfor «ut av hyllene» — pluss de små innkjøpene
 * (nettbutikk, foredrag) som er av samme størrelsesorden — og alt over
 * taket tegnes som en avskåret søyle med det ekte tallet over. Uten
 * hyllesalg finnes det ingen skala å følge, og aksen er vanlig.
 */
export function axisCap(
  points: DailyPoint[]
): { cap: number; ticks: number[] } | null {
  const shelfMax = Math.max(0, ...points.map((p) => p.sellThrough));
  if (shelfMax === 0) return null;
  const allMax = Math.max(0, ...points.map((p) => p.soldIn));
  const base = Math.max(
    shelfMax,
    ...points.map((p) => p.soldIn).filter((v) => v <= shelfMax * 2)
  );
  const step = base <= 10 ? 2 : base <= 25 ? 5 : base <= 60 ? 10 : 25;
  const cap = Math.ceil(base / step) * step;
  if (allMax <= cap) return null;
  const ticks: number[] = [];
  for (let tick = 0; tick <= cap; tick += step) ticks.push(tick);
  return { cap, ticks };
}

interface ChartRow extends DailyPoint {
  label: string;
  /** Det ekte innkjøpstallet når søyla er kappet. */
  soldInActual: number;
}

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartRow;
}

/** Solgt inn-søyla: vanlig søyle, eller avskåret med tallet over. */
function SoldInBar({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: BarShapeProps) {
  if (height <= 0) return null;
  const clipped = payload && payload.soldInActual > payload.soldIn;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={EXACT} />
      {clipped && (
        <>
          {/* Bruddmerke: to skrå streker i bakgrunnsfargen nær toppen. */}
          <path
            d={`M${x - 1} ${y + 10} L${x + width + 1} ${y + 6} M${x - 1} ${y + 15} L${x + width + 1} ${y + 11}`}
            stroke="var(--card, #fff)"
            strokeWidth={2}
          />
          <text
            x={x + width / 2}
            y={y - 5}
            textAnchor="middle"
            className="fill-foreground text-xs font-medium"
          >
            {payload.soldInActual.toLocaleString("nb-NO")}
          </text>
        </>
      )}
    </g>
  );
}

/** Tooltipen viser alltid det ekte tallet, ikke det kappede. */
function SalesTooltip(props: ComponentProps<typeof ChartTooltipContent>) {
  const payload = props.payload?.map((item) =>
    item.dataKey === "soldIn" && item.payload
      ? { ...item, value: Number(item.payload.soldInActual ?? item.value) }
      : item
  );
  return <ChartTooltipContent {...props} payload={payload} />;
}

export function SalesChart({
  points,
  emptyText,
}: {
  points: DailyPoint[];
  emptyText?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {emptyText ??
          "Ingenting registrert ennå. Grafen fylles så snart boka begynner å bevege seg."}
      </p>
    );
  }

  const axis = axisCap(points);
  const data: ChartRow[] = points.map((point) => ({
    ...point,
    soldIn: axis ? Math.min(point.soldIn, axis.cap) : point.soldIn,
    soldInActual: point.soldIn,
    label: kortDag(point.date),
  }));

  return (
    <div className="flex flex-col gap-2">
      <ChartContainer config={config} className="h-60 w-full">
        <BarChart
          data={data}
          accessibilityLayer
          barCategoryGap={4}
          barGap={1}
          margin={{ top: 20 }}
        >
          <HatchPattern />
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
            domain={axis ? [0, axis.cap] : undefined}
            ticks={axis?.ticks}
          />
          <ChartTooltip
            cursor={{ fillOpacity: 0.35 }}
            content={<SalesTooltip />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="soldIn"
            fill="var(--color-soldIn)"
            maxBarSize={20}
            shape={(props: BarShapeProps) => <SoldInBar {...props} />}
          />
          <Bar
            dataKey="sellThrough"
            fill={`url(#${HATCH_ID})`}
            radius={4}
            maxBarSize={20}
          />
        </BarChart>
      </ChartContainer>
      {axis && (
        <p className="text-muted-foreground text-sm">
          De store innkjøpene er kappet så den daglige bevegelsen synes — tallet
          over søyla er hele innkjøpet.
        </p>
      )}
    </div>
  );
}
