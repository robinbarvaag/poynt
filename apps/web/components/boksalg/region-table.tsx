"use client";

import type { RegionSummary } from "@/lib/boksalg/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@poynt/ui";

/**
 * Fylke for fylke: solgt, beholdning og hvor mange butikker som har boka.
 * Klikk på en rad velger fylket — samme valg som kartet styrer.
 */
export function RegionTable({
  regions,
  selectedRegion,
  onSelectRegion,
}: {
  regions: RegionSummary[];
  selectedRegion: string | null;
  onSelectRegion: (region: string | null) => void;
}) {
  const totals = regions.reduce(
    (sum, region) => ({
      stores: sum.stores + region.stores,
      withStock: sum.withStock + region.withStock,
      copies: sum.copies + region.copies,
      sold: sum.sold + region.sold,
    }),
    { stores: 0, withStock: 0, copies: 0, sold: 0 }
  );

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <Table>
        <caption className="text-muted-foreground px-3 pb-2 text-left text-xs">
          Klikk på et fylke for å vise bare de butikkene i lista under.
        </caption>
        <TableHeader className="bg-muted/60">
          <TableRow className="hover:bg-transparent">
            <TableHead>Fylke</TableHead>
            <TableHead className="text-right">Solgt</TableHead>
            <TableHead className="text-right">I butikk</TableHead>
            <TableHead className="text-right">Har boka</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regions.map((region) => {
            const selected = region.region === selectedRegion;
            return (
              <TableRow
                key={region.region}
                data-state={selected ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() => onSelectRegion(selected ? null : region.region)}
              >
                <TableCell className="font-medium">{region.region}</TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    region.sold > 0 && "font-semibold"
                  )}
                >
                  {region.sold}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {region.copies}
                </TableCell>
                <TableCell className="text-muted-foreground text-right tabular-nums">
                  {region.withStock} av {region.stores}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Hele landet</TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.sold}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.copies}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.withStock} av {totals.stores}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
