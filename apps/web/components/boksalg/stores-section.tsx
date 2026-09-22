"use client";

import type { RegionSummary, StoreRow } from "@/lib/boksalg/dashboard";
import type { ColumnFiltersState } from "@poynt/ui";
import { useCallback, useState } from "react";
import { RegionTable } from "./region-table";
import { StoreMap } from "./store-map";
import { StoreTable } from "./store-table";

/**
 * Kart, fylketabell og butikkliste deler ett fylkesvalg: klikk på en prikk
 * eller en fylkesrad, og lista under filtreres. Valget bor her, som
 * kolonnefilteret «region» i tabellens filterliste — så tabellens eget
 * fylkesfilter og kartet er samme ting, ikke to som kan sprike.
 */
export function StoresSection({
  stores,
  regions,
}: {
  stores: StoreRow[];
  regions: RegionSummary[];
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const regionFilter = columnFilters.find((filter) => filter.id === "region");
  const selectedRegion =
    Array.isArray(regionFilter?.value) && regionFilter.value.length === 1
      ? String(regionFilter.value[0])
      : null;

  const selectRegion = useCallback((region: string | null) => {
    setColumnFilters((old) => {
      const rest = old.filter((filter) => filter.id !== "region");
      return region ? [...rest, { id: "region", value: [region] }] : rest;
    });
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <StoreMap
          stores={stores}
          selectedRegion={selectedRegion}
          onSelectRegion={selectRegion}
        />
        <RegionTable
          regions={regions}
          selectedRegion={selectedRegion}
          onSelectRegion={selectRegion}
        />
      </div>
      <StoreTable
        stores={stores}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
      />
    </div>
  );
}
