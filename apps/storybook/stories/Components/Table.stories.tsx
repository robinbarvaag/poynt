import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Table",
  component: Table,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Rene tabell-primitiver: semantisk HTML med konsistent typografi, radskiller og hover. Ingen logikk — sortering, søk og paginering ligger i DataTable.",
      },
    },
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

const kanaler = [
  {
    kanal: "Norli",
    pris: "399 kr",
    forhandler: "−199,50 kr",
    netto: "159,60 kr",
  },
  {
    kanal: "ARK",
    pris: "399 kr",
    forhandler: "−199,50 kr",
    netto: "159,60 kr",
  },
  {
    kanal: "Egen nettbutikk",
    pris: "399 kr",
    forhandler: "−0,00 kr",
    netto: "351,51 kr",
  },
];

export const Standard: Story = {
  render: () => (
    <Table>
      <TableCaption>Hva hver kanal er verdt per solgt bok.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Kanal</TableHead>
          <TableHead className="text-right">Pris</TableHead>
          <TableHead className="text-right">Forhandler</TableHead>
          <TableHead className="text-right">Til forfatter</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {kanaler.map((rad) => (
          <TableRow key={rad.kanal}>
            <TableCell className="font-medium">{rad.kanal}</TableCell>
            <TableCell className="text-right tabular-nums">
              {rad.pris}
            </TableCell>
            <TableCell className="text-muted-foreground text-right tabular-nums">
              {rad.forhandler}
            </TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {rad.netto}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const MedBunnlinje: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fylke</TableHead>
          <TableHead className="text-right">Solgt</TableHead>
          <TableHead className="text-right">I butikk</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Troms</TableCell>
          <TableCell className="text-right tabular-nums">1</TableCell>
          <TableCell className="text-right tabular-nums">4</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Oslo</TableCell>
          <TableCell className="text-right tabular-nums">0</TableCell>
          <TableCell className="text-right tabular-nums">28</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Sum</TableCell>
          <TableCell className="text-right tabular-nums">1</TableCell>
          <TableCell className="text-right tabular-nums">32</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const ValgtRad: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Butikk</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>Jekta</TableCell>
          <TableCell>Tromsø</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Galleriet</TableCell>
          <TableCell>Bergen</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
