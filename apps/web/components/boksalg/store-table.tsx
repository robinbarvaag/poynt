"use client";

import { setStoreFollowUpAction } from "@/app/(intern)/intern/boksalg/actions";
import {
  FOLLOW_UP_OPTIONS,
  type FollowUpStatus,
  STORE_STATUS_OPTIONS,
  labelFor,
} from "@/lib/boksalg/constants";
import type { StoreRow } from "@/lib/boksalg/dashboard";
import {
  Button,
  type ColumnFiltersState,
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  createDataTableColumnHelper,
  dataTableSelectionColumn,
} from "@poynt/ui";
import { CopyIcon, ExternalLinkIcon, PhoneIcon } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { STATUS_COLORS } from "./chart-tokens";

/**
 * Butikker og kontaktinfo: hvem har boka, hvem har gått tom, hvem har aldri
 * hatt den — og hvem Susanne har snakket med.
 *
 * «Til oppfølging» er snarveien: butikkene som ikke har boka nå. Velg dem,
 * kopier e-postadressene, send én samlet e-post. Oppfølgingsstatusen settes
 * rett i tabellen, så hun slipper å åpne admin for hver butikk hun ringer.
 */

const helper = createDataTableColumnHelper<StoreRow>();

const REGION_OPTIONS_CACHE = new Map<
  string,
  { value: string; label: string }[]
>();

function regionOptions(stores: StoreRow[]) {
  const key = String(stores.length);
  const cached = REGION_OPTIONS_CACHE.get(key);
  if (cached) return cached;
  const regions = [...new Set(stores.map((store) => store.region ?? "Ukjent"))]
    .sort((a, b) => a.localeCompare(b, "nb"))
    .map((region) => ({ value: region, label: region }));
  REGION_OPTIONS_CACHE.set(key, regions);
  return regions;
}

function FollowUpSelect({ store }: { store: StoreRow }) {
  const [value, setValue] = useState<FollowUpStatus>(store.followUpStatus);
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const status = next as FollowUpStatus;
        setValue(status);
        startTransition(async () => {
          const result = await setStoreFollowUpAction(store.id, status);
          if (!result.ok) setValue(store.followUpStatus);
        });
      }}
      disabled={pending}
    >
      <SelectTrigger
        className="h-8 w-44 text-xs"
        aria-label={`Oppfølging for ${store.name}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {FOLLOW_UP_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const columns = [
  dataTableSelectionColumn<StoreRow>(),
  helper.accessor((row) => `${row.name} ${row.city ?? ""}`, {
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Butikk" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.city && (
          <span className="text-muted-foreground text-xs">
            {row.original.city}
          </span>
        )}
      </div>
    ),
    enableHiding: false,
    sortFn: "text",
  }),
  helper.accessor("region", {
    header: "Fylke",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue() ?? "–"}</span>
    ),
    filterFn: "oneOf",
    enableGlobalFilter: false,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: STATUS_COLORS[status] }}
            aria-hidden
          />
          {labelFor(STORE_STATUS_OPTIONS, status)}
        </span>
      );
    },
    filterFn: "oneOf",
    enableSorting: false,
    enableGlobalFilter: false,
  }),
  helper.accessor("currentQty", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nå" className="ml-auto" />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right font-semibold tabular-nums">
        {getValue()}
      </span>
    ),
    sortFn: "basic",
    enableGlobalFilter: false,
    meta: { headerClassName: "text-right" },
  }),
  helper.accessor("soldEstimate", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Solgt"
        className="ml-auto"
      />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">
        {getValue() > 0 ? getValue() : ""}
      </span>
    ),
    sortFn: "basic",
    enableGlobalFilter: false,
    meta: { headerClassName: "text-right" },
  }),
  helper.accessor("email", {
    header: "Kontakt",
    cell: ({ row }) => (
      <div className="flex flex-col text-xs">
        {row.original.email && (
          <a
            href={`mailto:${row.original.email}`}
            className="text-primary hover:underline"
          >
            {row.original.email}
          </a>
        )}
        {row.original.phone && (
          <a
            href={`tel:${row.original.phone.replace(/\s+/g, "")}`}
            className="text-muted-foreground flex items-center gap-1 hover:underline"
          >
            <PhoneIcon className="size-3" aria-hidden />
            {row.original.phone}
          </a>
        )}
      </div>
    ),
    enableSorting: false,
  }),
  helper.accessor("address", {
    header: "Adresse og åpningstider",
    cell: ({ row }) => (
      <div className="flex max-w-64 flex-col text-xs">
        <span className="truncate">
          {[row.original.address, row.original.postcode]
            .filter(Boolean)
            .join(", ")}
        </span>
        {row.original.schedule && (
          <span className="text-muted-foreground truncate">
            {row.original.schedule.split("\n").join(" · ")}
          </span>
        )}
      </div>
    ),
    enableSorting: false,
    meta: { label: "Adresse" },
  }),
  helper.accessor("followUpStatus", {
    header: "Oppfølging",
    cell: ({ row }) => <FollowUpSelect store={row.original} />,
    filterFn: "oneOf",
    enableSorting: false,
    enableGlobalFilter: false,
  }),
  helper.display({
    id: "admin",
    cell: ({ row }) => (
      <a
        href={`/admin/collections/book-stores/${row.original.id}`}
        className="text-muted-foreground hover:text-foreground inline-flex"
        aria-label={`Åpne ${row.original.name} i admin`}
        title="Notater og detaljer i admin"
      >
        <ExternalLinkIcon className="size-4" aria-hidden />
      </a>
    ),
    enableHiding: false,
    meta: { headerClassName: "w-8", cellClassName: "w-8" },
  }),
];

const FOLLOW_UP_PRESET: ColumnFiltersState = [
  { id: "status", value: ["gatt_tom", "ikke_hatt"] },
];

export function StoreTable({
  stores,
  columnFilters,
  onColumnFiltersChange,
}: {
  stores: StoreRow[];
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
}) {
  const [selected, setSelected] = useState<StoreRow[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const regions = useMemo(() => regionOptions(stores), [stores]);

  const followUpActive = columnFilters.some(
    (filter) =>
      filter.id === "status" &&
      Array.isArray(filter.value) &&
      filter.value.length === 2 &&
      filter.value.includes("gatt_tom") &&
      filter.value.includes("ikke_hatt")
  );

  return (
    <DataTable
      columns={columns}
      data={stores}
      getRowId={(store) => String(store.id)}
      searchPlaceholder="Søk butikk, by eller e-post"
      columnFilters={columnFilters}
      onColumnFiltersChange={onColumnFiltersChange}
      onSelectionChange={setSelected}
      pageSize={50}
      emptyText="Ingen butikker matcher."
      caption="«Gått tom» betyr at butikken har hatt boka i en tidligere måling, men har 0 nå. «Ikke hatt boka» betyr 0 i alle målingene — de kan likevel ha solgt ut før første måling."
      toolbar={(table) => (
        <>
          <DataTableFacetedFilter
            column={table.getColumn("region")}
            title="Fylke"
            options={regions}
          />
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={STORE_STATUS_OPTIONS}
          />
          <DataTableFacetedFilter
            column={table.getColumn("followUpStatus")}
            title="Oppfølging"
            options={[...FOLLOW_UP_OPTIONS]}
          />
          <Button
            variant={followUpActive ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onColumnFiltersChange(
                followUpActive
                  ? columnFilters.filter((filter) => filter.id !== "status")
                  : [
                      ...columnFilters.filter(
                        (filter) => filter.id !== "status"
                      ),
                      ...FOLLOW_UP_PRESET,
                    ]
              )
            }
          >
            Til oppfølging
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const rows =
                selected.length > 0
                  ? selected
                  : table.getFilteredRowModel().rows.map((row) => row.original);
              const emails = [
                ...new Set(
                  rows.map((store) => store.email).filter(Boolean) as string[]
                ),
              ];
              try {
                await navigator.clipboard.writeText(emails.join(", "));
                setCopied(
                  `${emails.length} ${emails.length === 1 ? "adresse" : "adresser"} kopiert${selected.length > 0 ? " (valgte)" : " (alle i lista)"}`
                );
              } catch {
                setCopied("Kunne ikke kopiere — merk og kopier manuelt.");
              }
              setTimeout(() => setCopied(null), 4000);
            }}
          >
            <CopyIcon aria-hidden />
            Kopier e-postadresser
          </Button>
          {copied && (
            <output className="text-muted-foreground text-sm">{copied}</output>
          )}
        </>
      )}
    />
  );
}
