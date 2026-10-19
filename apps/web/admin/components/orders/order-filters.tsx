"use client";

import { Pill, useListQuery } from "@payloadcms/ui";
import type { Where } from "payload";

/**
 * Hurtigfiltre over Bestillinger-lista, montert som `beforeListTable`.
 *
 * Payloads eget filter («Filtrer» → felt → operator → verdi) er for tungvint
 * til hverdagsbruk: Susanne skal med ett klikk se hva som ligger og venter på
 * å bli sendt. Filtrene setter bare `where` på lista via `refineListData`,
 * så søk, kolonner og paginering virker som før.
 */
type QuickFilter = {
  key: string;
  label: string;
  where?: Where;
};

const FILTERS: QuickFilter[] = [
  { key: "all", label: "Alle" },
  {
    key: "to-ship",
    label: "Skal sendes",
    where: {
      and: [
        { status: { equals: "paid" } },
        { requiresShipping: { equals: true } },
        { shippingStatus: { not_equals: "shipped" } },
      ],
    },
  },
  {
    key: "shipped",
    label: "Sendt",
    where: {
      and: [
        { requiresShipping: { equals: true } },
        { shippingStatus: { equals: "shipped" } },
      ],
    },
  },
  {
    key: "digital",
    label: "Digitale",
    where: {
      and: [
        { status: { equals: "paid" } },
        { requiresShipping: { not_equals: true } },
      ],
    },
  },
  {
    key: "unpaid",
    label: "Ikke betalt",
    where: { status: { not_equals: "paid" } },
  },
];

export function OrderFilters() {
  const { query, refineListData } = useListQuery();
  const current = JSON.stringify(query.where ?? null);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <span
        style={{ fontSize: "0.85rem", color: "var(--theme-elevation-600)" }}
      >
        Vis:
      </span>
      {FILTERS.map((filter) => {
        const active = JSON.stringify(filter.where ?? null) === current;
        return (
          <Pill
            key={filter.key}
            pillStyle={active ? "dark" : "light"}
            size="small"
            aria-checked={active}
            onClick={() => {
              void refineListData({ where: filter.where, page: 1 });
            }}
          >
            {filter.label}
          </Pill>
        );
      })}
    </div>
  );
}
