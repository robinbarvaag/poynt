"use client";

import type { StockHistoryPoint } from "@/lib/boksalg/dashboard";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@poynt/ui";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EXACT } from "./chart-tokens";

/**
 * Eksemplarer ute i butikk over tid. Én serie, så ingen legendeboks — tittelen
 * navngir den.
 *
 * Kurven er ikke salg: den går opp ved påfyll og ned ved salg. Den forteller
 * hvor bredt boka står ute, som er et helt annet (og før utgivelse det eneste)
 * signal enn salgsgrafen. Antall butikker står i tooltipen — det er en annen
 * størrelse og får ikke sin egen akse.
 */

const config = {
  copies: { label: "Eksemplarer i butikk", color: EXACT },
} satisfies ChartConfig;

function formatDay(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
  });
}

export function StockChart({ points }: { points: StockHistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Kurven trenger minst to hentinger. Første tegnes i morgen tidlig.
      </p>
    );
  }

  const data = points.map((point) => ({
    ...point,
    label: formatDay(point.date),
  }));

  return (
    <ChartContainer config={config} className="h-50 w-full">
      <AreaChart data={data} accessibilityLayer>
        <defs>
          <linearGradient id="boksalg-stock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={EXACT} stopOpacity={0.25} />
            <stop offset="100%" stopColor={EXACT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
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
          width={36}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, _name, _item, _index, payload) => (
                <span className="text-foreground">
                  <strong className="tabular-nums">{String(value)}</strong>{" "}
                  eksemplarer i{" "}
                  <strong className="tabular-nums">
                    {String(payload?.stores ?? 0)}
                  </strong>{" "}
                  butikker
                </span>
              )}
            />
          }
        />
        <Area
          dataKey="copies"
          type="monotone"
          stroke="var(--color-copies)"
          strokeWidth={2}
          fill="url(#boksalg-stock-fill)"
          dot={false}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff" }}
        />
      </AreaChart>
    </ChartContainer>
  );
}
