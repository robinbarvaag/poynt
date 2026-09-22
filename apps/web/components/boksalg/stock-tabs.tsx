"use client";

import type { StockSummary } from "@/lib/boksalg/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { antall, tidspunkt } from "./format";
import { StockChart } from "./stock-chart";

/**
 * Én fane per kjede for lagerhistorikken, i stedet for ett kort per kjede
 * nedover siden. Første kjede er åpen.
 */
export function StockTabs({ stock }: { stock: StockSummary[] }) {
  const first = stock[0];
  if (!first) return null;

  return (
    <Tabs defaultValue={first.sourceKey}>
      <TabsList>
        {stock.map((entry) => (
          <TabsTrigger key={entry.sourceKey} value={entry.sourceKey}>
            {entry.label}
            {entry.totalCopies > 0 && (
              <span className="text-muted-foreground tabular-nums">
                {antall(entry.totalCopies)}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {stock.map((entry) => (
        <TabsContent
          key={entry.sourceKey}
          value={entry.sourceKey}
          className="flex flex-col gap-3 pt-2"
        >
          <p className="text-muted-foreground text-sm">
            {entry.storesWithStock > 0
              ? `${antall(entry.totalCopies)} eksemplarer i ${antall(entry.storesWithStock)} av ${antall(entry.storeCount)} butikker.`
              : (entry.note?.replace(/\.?$/, ".") ??
                "Ingen butikker fører boka ennå.")}{" "}
            Sist hentet {tidspunkt(entry.fetchedAt)}.
          </p>
          <StockChart points={entry.history} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
