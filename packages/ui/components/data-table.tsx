"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnVisibilityState,
  type FilterFn,
  type PaginationState,
  type ReactTable,
  type RowData,
  type RowSelectionState,
  type SortingState,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Settings2Icon,
} from "lucide-react";
import * as React from "react";

import { cn } from "@poynt/ui/lib/utils";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // (CheckboxItem brukes fortsatt i kolonnevelgeren, der en hake holder.)
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./form/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

/**
 * Datatabell over TanStack Table v9: sortering, fritekstsøk, fasetterte
 * kolonnefiltre, paginering, radvalg og kolonnevisning — i ett fast
 * funksjonssett, så alle tabeller i appen oppfører seg likt.
 *
 * Kolonnene bygges med `createDataTableColumnHelper<T>()`, som binder
 * funksjonssettet for deg. Hjelpekomponentene `DataTableColumnHeader`
 * (sorterbar overskrift), `DataTableFacetedFilter` (velg flere verdier) og
 * `dataTableSelectionColumn()` (avkryssingskolonne) dekker det vanlige.
 *
 * Tilstanden eies av React (`state` + `on*Change`), ikke av tabellen selv,
 * slik at en forelder kan styre f.eks. et fylkesfilter fra et kart. Send inn
 * `columnFilters`/`onColumnFiltersChange` for det; ellers holder tabellen
 * filtrene internt.
 */

/**
 * «Verdien er én av de valgte» — det fasetterte filtre trenger. TanStacks
 * egen `arrIncludesSome` forventer at RADVERDIEN er en liste (tagger o.l.);
 * for en vanlig streng- eller tallkolonne gir den null treff.
 */
const filterFn_oneOf: FilterFn<DataTableFeaturesShape, RowData> = (
  row,
  columnId,
  filterValue
) => {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  return filterValue.includes(row.getValue(columnId));
};
filterFn_oneOf.autoRemove = (value: unknown) =>
  !Array.isArray(value) || value.length === 0;

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
    arrIncludesSome: filterFn_arrIncludesSome,
    oneOf: filterFn_oneOf,
  },
  globalFilteringFeature,
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
});

export type DataTableFeatures = typeof dataTableFeatures;

// Filterfunksjonen over må typedeklareres før funksjonssettet den inngår i
// finnes; den bryr seg ikke om hvilke features som er registrert.
// biome-ignore lint/suspicious/noExplicitAny: se over
type DataTableFeaturesShape = any;

// TValue varierer per kolonne; TanStack bruker selv `any` for dette.
export type DataTableColumnDef<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  // biome-ignore lint/suspicious/noExplicitAny: se over
  any
>;

export type DataTableInstance<TData extends RowData> = ReactTable<
  DataTableFeatures,
  TData
>;

/** Kolonnehjelper bundet til datatabellens funksjonssett. */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

export interface DataTableProps<TData extends RowData> {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  /** Stabil rad-ID, så radvalg overlever sortering og filtrering. */
  getRowId?: (row: TData) => string;
  /** Plassholder i søkefeltet. Uten denne vises ikke søk. */
  searchPlaceholder?: string;
  /** Innhold i verktøylinja ved siden av søket — filtre, handlinger. */
  toolbar?: (table: DataTableInstance<TData>) => React.ReactNode;
  /** Kolonnefiltre styrt utenfra (f.eks. fra et kart). */
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onSelectionChange?: (rows: TData[]) => void;
  pageSize?: number;
  emptyText?: string;
  /** Tekst under tabellen, f.eks. en forklaring av statusene. */
  caption?: React.ReactNode;
  className?: string;
}

const PAGE_SIZES = [20, 50, 100, 250];

function resolveUpdater<T>(updater: T | ((old: T) => T), old: T): T {
  return typeof updater === "function"
    ? (updater as (old: T) => T)(old)
    : updater;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  searchPlaceholder,
  toolbar,
  columnFilters: controlledFilters,
  onColumnFiltersChange,
  onSelectionChange,
  pageSize = 20,
  emptyText = "Ingen treff.",
  caption,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [internalFilters, setInternalFilters] =
    React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const columnFilters = controlledFilters ?? internalFilters;
  const setColumnFilters = React.useCallback(
    (
      updater:
        | ColumnFiltersState
        | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
      const next = resolveUpdater(updater, columnFilters);
      if (onColumnFiltersChange) onColumnFiltersChange(next);
      else setInternalFilters(next);
      // Nytt filter → tilbake til første side, ellers står man på en tom side.
      setPagination((old) => ({ ...old, pageIndex: 0 }));
    },
    [columnFilters, onColumnFiltersChange]
  );

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
  });

  // Gi forelderen de valgte radene som data, ikke som tabell-interne rad-objekter.
  // selectedRows er en ny liste hver render; velg-tilstanden er det som teller.
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  // biome-ignore lint/correctness/useExhaustiveDependencies: se kommentaren over
  React.useEffect(() => {
    onSelectionChange?.(selectedRows.map((row) => row.original));
  }, [rowSelection, onSelectionChange]);

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const from =
    filteredCount === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
  const to = Math.min(
    filteredCount,
    (pagination.pageIndex + 1) * pagination.pageSize
  );
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide());

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {(searchPlaceholder || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchPlaceholder && (
            <Input
              type="search"
              value={globalFilter}
              onChange={(event) => {
                setGlobalFilter(event.target.value);
                setPagination((old) => ({ ...old, pageIndex: 0 }));
              }}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-9 w-full max-w-xs"
            />
          )}
          {toolbar?.(table)}
          {hideableColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Settings2Icon aria-hidden />
                  Kolonner
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Vis kolonner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : (column.columnDef.meta?.label ?? column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      <div className="border-border overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/60">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.columnDef.meta?.headerClassName}
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.cellClassName}
                    >
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {caption && <p className="text-muted-foreground text-xs">{caption}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          {selectedRows.length > 0 && (
            <>
              <strong className="text-foreground tabular-nums">
                {selectedRows.length}
              </strong>{" "}
              valgt ·{" "}
            </>
          )}
          Viser{" "}
          <span className="tabular-nums">
            {from}–{to}
          </span>{" "}
          av <span className="tabular-nums">{filteredCount}</span>
        </p>
        <div className="flex items-center gap-2">
          <label className="text-muted-foreground flex items-center gap-2">
            Per side
            <select
              value={pagination.pageSize}
              onChange={(event) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number(event.target.value),
                })
              }
              className="border-border bg-card h-8 rounded-md border px-2 text-sm"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Forrige side"
          >
            <ChevronLeftIcon aria-hidden />
          </Button>
          <span className="text-muted-foreground tabular-nums">
            {pageCount === 0 ? 0 : pagination.pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Neste side"
          >
            <ChevronRightIcon aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Sorterbar kolonneoverskrift: klikk veksler stigende → synkende → av. */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: {
    getCanSort: () => boolean;
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  title: string;
  className?: string;
  // Typen holdes bevisst løs: kolonnen kommer fra `header: ({ column }) => …`.
  _phantom?: [TData, TValue];
}) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }
  const sorted = column.getIsSorted();
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={cn(
        "hover:text-foreground -ml-2 inline-flex h-8 items-center gap-1 rounded-md px-2 font-medium",
        className
      )}
      aria-label={`Sorter etter ${title}`}
    >
      {title}
      {sorted === "asc" ? (
        <ArrowUpIcon className="size-3.5" aria-hidden />
      ) : sorted === "desc" ? (
        <ArrowDownIcon className="size-3.5" aria-hidden />
      ) : (
        <ArrowUpDownIcon
          className="text-muted-foreground size-3.5"
          aria-hidden
        />
      )}
    </button>
  );
}

/**
 * Fasettert filter: velg én eller flere verdier fra kolonnens faktiske
 * innhold, med antall per verdi. Kolonnen må ha `filterFn: "oneOf"`.
 */
export function DataTableFacetedFilter({
  column,
  title,
  options,
}: {
  column:
    | {
        getFilterValue: () => unknown;
        setFilterValue: (value: unknown) => void;
        getFacetedUniqueValues: () => Map<unknown, number>;
      }
    | undefined;
  title: string;
  /** Rekkefølge og etiketter. Verdier som ikke finnes i dataene skjules. */
  options: { value: string; label: string }[];
}) {
  if (!column) return null;
  const selected = new Set(
    (column.getFilterValue() as string[] | undefined) ?? []
  );
  const facets = column.getFacetedUniqueValues();
  const visible = options.filter((option) => facets.has(option.value));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {title}
          {selected.size > 0 && (
            <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-xs tabular-nums">
              {selected.size}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        {visible.map((option) => {
          const isSelected = selected.has(option.value);
          return (
            // Vanlig Item med egen avkryssingsboks, ikke CheckboxItem: den
            // viser bare en hake NÅR noe er valgt, og da ser ikke radene ut som
            // noe man kan krysse av. En tom boks på hver rad sier det.
            <DropdownMenuItem
              key={option.value}
              role="menuitemcheckbox"
              aria-checked={isSelected}
              onSelect={(event) => {
                event.preventDefault();
                const next = new Set(selected);
                if (isSelected) next.delete(option.value);
                else next.add(option.value);
                column.setFilterValue(next.size > 0 ? [...next] : undefined);
              }}
            >
              <span
                className={cn(
                  "border-primary flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50 [&_svg]:invisible"
                )}
                aria-hidden
              >
                <CheckIcon className="size-3" />
              </span>
              <span className="flex-1">{option.label}</span>
              <span className="text-muted-foreground ml-3 text-xs tabular-nums">
                {facets.get(option.value) ?? 0}
              </span>
            </DropdownMenuItem>
          );
        })}
        {selected.size > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => column.setFilterValue(undefined)}>
              <CheckIcon className="size-3.5 opacity-0" aria-hidden />
              Nullstill
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Avkryssingskolonne for radvalg. Legg den først i kolonnelista. */
export function dataTableSelectionColumn<
  TData extends RowData,
>(): DataTableColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        size="sm"
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Velg alle på siden"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        size="sm"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Velg rad"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: { headerClassName: "w-8", cellClassName: "w-8" },
  };
}

export type { ColumnFiltersState } from "@tanstack/react-table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TFeatures, TData, TValue> {
    /** Etikett i kolonnevelgeren når `header` ikke er en streng. */
    label?: string;
    headerClassName?: string;
    cellClassName?: string;
  }
}
