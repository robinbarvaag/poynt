"use client";

import type { TimelinePoint } from "@/lib/boksalg/dashboard";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@poynt/ui";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ESTIMATE, EXACT, HATCH_ID } from "./chart-tokens";
import { HatchPattern } from "./hatch-pattern";

/**
 * Bøker per dag. Én serie per graf — bevisst.
 *
 * «Solgt inn» (bokhandelens innkjøp, avregninger, nettbutikken) og «ut av
 * hyllene» (utledet av at butikklageret gikk ned) er to stadier i samme reise,
 * ikke to deler av en sum. Sto de stablet i samme graf, ville de blitt lest
 * som et totaltall — og de samme bøkene talt to ganger. Derfor egen graf hver,
 * og estimatet er skravert så usikkerheten leses uten farge.
 */

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

export function SalesChart({
  points,
  variant = "revenue",
  emptyText,
}: {
  points: TimelinePoint[];
  /** «revenue» = solgt inn (eksakt). «sellthrough» = estimat, skraveres. */
  variant?: "revenue" | "sellthrough";
  emptyText?: string;
}) {
  const estimated = variant === "sellthrough";

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {emptyText ??
          "Ingen salg registrert ennå. Grafen fylles så snart boka begynner å bevege seg."}
      </p>
    );
  }

  const config = {
    copies: {
      label: estimated ? "Ut av hyllene" : "Solgt inn",
      color: estimated ? ESTIMATE : EXACT,
    },
  } satisfies ChartConfig;

  const data = points.map((point) => ({
    ...point,
    label: formatDay(point.date),
  }));

  return (
    <ChartContainer config={config} className="h-55 w-full">
      <BarChart data={data} accessibilityLayer barCategoryGap={4}>
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
          content={<ChartTooltipContent color={estimated ? ESTIMATE : EXACT} />}
        />
        <Bar
          dataKey="copies"
          fill={estimated ? `url(#${HATCH_ID})` : "var(--color-copies)"}
          radius={4}
          maxBarSize={28}
        />
      </BarChart>
    </ChartContainer>
  );
}
