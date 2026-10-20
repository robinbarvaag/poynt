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

  const data = points.map((point) => ({
    ...point,
    label: kortDag(point.date),
  }));

  return (
    <ChartContainer config={config} className="h-60 w-full">
      <BarChart data={data} accessibilityLayer barCategoryGap={4} barGap={1}>
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
        />
        <ChartTooltip
          cursor={{ fillOpacity: 0.35 }}
          content={<ChartTooltipContent />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="soldIn"
          fill="var(--color-soldIn)"
          radius={4}
          maxBarSize={20}
        />
        <Bar
          dataKey="sellThrough"
          fill={`url(#${HATCH_ID})`}
          radius={4}
          maxBarSize={20}
        />
      </BarChart>
    </ChartContainer>
  );
}
