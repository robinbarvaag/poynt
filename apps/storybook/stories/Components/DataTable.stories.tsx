import {
  Badge,
  DataTable,
  DataTableColumnHeader,
  DataTableFacetedFilter,
  createDataTableColumnHelper,
  dataTableSelectionColumn,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

type Butikk = {
  id: number;
  navn: string;
  by: string;
  fylke: string;
  status: "har_boka" | "gatt_tom" | "ikke_hatt";
  antall: number;
  epost: string;
};

const STATUS: Record<Butikk["status"], string> = {
  har_boka: "Har boka",
  gatt_tom: "Gått tom",
  ikke_hatt: "Ikke hatt boka",
};

const butikker: Butikk[] = [
  {
    id: 1,
    navn: "Jekta",
    by: "Tromsø",
    fylke: "Troms",
    status: "har_boka",
    antall: 2,
    epost: "jekta@norli.no",
  },
  {
    id: 2,
    navn: "Galleriet",
    by: "Bergen",
    fylke: "Vestland",
    status: "har_boka",
    antall: 4,
    epost: "galleriet@norli.no",
  },
  {
    id: 3,
    navn: "Universitetsgata",
    by: "Oslo",
    fylke: "Oslo",
    status: "har_boka",
    antall: 4,
    epost: "universitetsgata@norli.no",
  },
  {
    id: 4,
    navn: "Byporten",
    by: "Oslo",
    fylke: "Oslo",
    status: "gatt_tom",
    antall: 0,
    epost: "byporten@norli.no",
  },
  {
    id: 5,
    navn: "Farsund",
    by: "Farsund",
    fylke: "Agder",
    status: "ikke_hatt",
    antall: 0,
    epost: "farsund@norli.no",
  },
  {
    id: 6,
    navn: "Kvadrat",
    by: "Sandnes",
    fylke: "Rogaland",
    status: "har_boka",
    antall: 1,
    epost: "kvadrat@norli.no",
  },
  {
    id: 7,
    navn: "Bokhuset",
    by: "Tromsø",
    fylke: "Troms",
    status: "ikke_hatt",
    antall: 0,
    epost: "bokhuset.tromso@norli.no",
  },
  {
    id: 8,
    navn: "Solsiden",
    by: "Trondheim",
    fylke: "Trøndelag",
    status: "har_boka",
    antall: 2,
    epost: "solsiden@norli.no",
  },
];

const helper = createDataTableColumnHelper<Butikk>();

const columns = [
  dataTableSelectionColumn<Butikk>(),
  helper.accessor((row) => `${row.navn} ${row.by}`, {
    id: "navn",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Butikk" />
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.navn}</span>
        <span className="text-muted-foreground text-xs">{row.original.by}</span>
      </div>
    ),
    enableHiding: false,
    sortFn: "text",
  }),
  helper.accessor("fylke", {
    header: "Fylke",
    filterFn: "oneOf",
    enableGlobalFilter: false,
  }),
  helper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => (
      <Badge
        variant={getValue() === "har_boka" ? "soft-primary" : "muted"}
        size="sm"
      >
        {STATUS[getValue()]}
      </Badge>
    ),
    filterFn: "oneOf",
    enableSorting: false,
    enableGlobalFilter: false,
  }),
  helper.accessor("antall", {
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Antall"
        className="ml-auto"
      />
    ),
    cell: ({ getValue }) => (
      <span className="block text-right tabular-nums">{getValue()}</span>
    ),
    sortFn: "basic",
    enableGlobalFilter: false,
    meta: { headerClassName: "text-right" },
  }),
  helper.accessor("epost", {
    header: "E-post",
    cell: ({ getValue }) => (
      <a
        href={`mailto:${getValue()}`}
        className="text-primary text-xs hover:underline"
      >
        {getValue()}
      </a>
    ),
    enableSorting: false,
  }),
];

const meta = {
  title: "Komponenter/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Datatabell med sortering, fritekstsøk, fasetterte filtre, paginering, radvalg og kolonnevisning. Kolonnene bygges med createDataTableColumnHelper.",
      },
    },
  },
} satisfies Meta<typeof DataTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  args: {
    columns,
    data: butikker,
    getRowId: (row: Butikk) => String(row.id),
    searchPlaceholder: "Søk butikk eller by",
    pageSize: 20,
  },
  // biome-ignore lint/suspicious/noExplicitAny: kolonnetypen er generisk over raddata; storyen låser den til Butikk
  render: (args) => <DataTable {...(args as any)} />,
};

export const MedFiltre: Story = {
  args: {
    ...Standard.args,
    toolbar: (table) => (
      <>
        <DataTableFacetedFilter
          column={table.getColumn("fylke")}
          title="Fylke"
          options={[
            "Agder",
            "Oslo",
            "Rogaland",
            "Troms",
            "Trøndelag",
            "Vestland",
          ].map((f) => ({ value: f, label: f }))}
        />
        <DataTableFacetedFilter
          column={table.getColumn("status")}
          title="Status"
          options={Object.entries(STATUS).map(([value, label]) => ({
            value,
            label,
          }))}
        />
      </>
    ),
  },
  // biome-ignore lint/suspicious/noExplicitAny: se Standard
  render: (args) => <DataTable {...(args as any)} />,
};

export const Søk: Story = {
  ...Standard,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Galleriet")).toBeVisible();
    await userEvent.type(canvas.getByRole("searchbox"), "Tromsø");
    await expect(canvas.getByText("Jekta")).toBeVisible();
    await expect(canvas.getByText("Bokhuset")).toBeVisible();
    await expect(canvas.queryByText("Galleriet")).not.toBeInTheDocument();
    await expect(canvas.getByText(/viser/i)).toHaveTextContent("1–2 av 2");
  },
};

export const Sortering: Story = {
  ...Standard,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: /sorter etter antall/i })
    );
    const rows = canvas.getAllByRole("row");
    // Første datarad (etter overskriften) skal være den med lavest antall.
    await expect(rows[1]).toHaveTextContent("0");
    await userEvent.click(
      canvas.getByRole("button", { name: /sorter etter antall/i })
    );
    await expect(canvas.getAllByRole("row")[1]).toHaveTextContent("4");
  },
};

export const Tom: Story = {
  args: { ...Standard.args, data: [], emptyText: "Ingen butikker ennå." },
  // biome-ignore lint/suspicious/noExplicitAny: se Standard
  render: (args) => <DataTable {...(args as any)} />,
};
