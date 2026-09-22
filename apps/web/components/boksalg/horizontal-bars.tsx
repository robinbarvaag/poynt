"use client";

import { type ChartConfig, ChartContainer } from "@poynt/ui";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { EXACT } from "./chart-tokens";

/**
 * Vannrette søyler for én størrelse fordelt på kategorier — utgifter per post,
 * netto per bok per kanal. Én måling, altså én farge: å gi hver kategori sin
 * egen hue ville antydet et skille som ikke finnes i dataene.
 *
 * Verdien står som direkte etikett på hver søyle, så grafen trenger ingen
 * tallakse. Rader med `muted` (f.eks. en post på 0 kr) tones ned.
 */

export interface BarRow {
  label: string;
  value: number;
  /** Ferdig formatert verdi, f.eks. «121 250 kr». */
  display: string;
  muted?: boolean;
}

const config = {
  value: { label: "Verdi", color: EXACT },
} satisfies ChartConfig;

const ROW_HEIGHT = 34;

export function HorizontalBars({
  rows,
  emptyText = "Ingenting å vise ennå.",
}: {
  rows: BarRow[];
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {emptyText}
      </p>
    );
  }

  const data = rows.map((row) => ({
    ...row,
    // Recharts kan ikke tegne en negativ eller null-bredde pent; vis en
    // hårfin søyle så raden ikke ser tom ut.
    plotted: Math.max(row.value, 0),
  }));

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: rows.length * ROW_HEIGHT + 8 }}
    >
      <BarChart
        data={data}
        layout="vertical"
        accessibilityLayer
        margin={{ left: 0, right: 96, top: 4, bottom: 4 }}
        barCategoryGap={6}
      >
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={150}
          tick={{ fontSize: 13 }}
        />
        <Bar
          dataKey="plotted"
          fill="var(--color-value)"
          radius={4}
          maxBarSize={18}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="display"
            position="right"
            offset={8}
            className="fill-foreground text-xs font-semibold tabular-nums"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
