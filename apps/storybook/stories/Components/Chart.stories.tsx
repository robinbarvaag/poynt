import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const meta = {
  title: "Komponenter/Chart",
  component: ChartContainer,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Graf-primitiver over Recharts. ChartContainer tar en config med etikett og farge per serie og eksponerer fargen som `--color-<nøkkel>`, så tooltip, legende og selve grafen aldri kan drifte fra hverandre.",
      },
    },
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Datafargene er ikke merkevarefargene: Poynt-paletten faller på lyshet, kroma
 * og kontrast som datamerker. Disse er steget ned i samme hue-familier til de
 * består alle seks palettsjekkene.
 */
const config = {
  solgt: { label: "Solgt inn", color: "#00794e" },
  estimert: { label: "Ut av hyllene", color: "#b07d06" },
} satisfies ChartConfig;

const perDag = [
  { dag: "14. okt", solgt: 12, estimert: 0 },
  { dag: "15. okt", solgt: 40, estimert: 3 },
  { dag: "16. okt", solgt: 8, estimert: 7 },
  { dag: "17. okt", solgt: 5, estimert: 11 },
  { dag: "18. okt", solgt: 0, estimert: 9 },
  { dag: "19. okt", solgt: 3, estimert: 6 },
];

export const Søyler: Story = {
  render: () => (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={perDag} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dag" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="solgt" fill="var(--color-solgt)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const ToSerierMedLegende: Story = {
  render: () => (
    <ChartContainer config={config} className="h-[260px] w-full">
      <BarChart data={perDag} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dag" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="solgt" fill="var(--color-solgt)" radius={4} />
        <Bar dataKey="estimert" fill="var(--color-estimert)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

const lager = [
  { dag: "15. okt", eksemplarer: 0 },
  { dag: "16. okt", eksemplarer: 210 },
  { dag: "17. okt", eksemplarer: 198 },
  { dag: "18. okt", eksemplarer: 187 },
  { dag: "19. okt", eksemplarer: 240 },
  { dag: "20. okt", eksemplarer: 231 },
];

export const Linje: Story = {
  render: () => (
    <ChartContainer
      config={{ eksemplarer: { label: "I butikk", color: "#00794e" } }}
      className="h-[220px] w-full"
    >
      <LineChart data={lager} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dag" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Line
          dataKey="eksemplarer"
          type="monotone"
          stroke="var(--color-eksemplarer)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  ),
};
