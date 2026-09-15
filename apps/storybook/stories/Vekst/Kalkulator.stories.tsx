import { GrowthCalculator, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import {
  FORECAST_MONTHLY_NEED,
  PROFIT_EXAMPLE,
} from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof GrowthCalculator> = {
  title: "Vekst/Kalkulator",
  component: GrowthCalculator,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Kalkulatorene fra «Verdifull vekst»: lønnsomhet, timepris og spåkula " +
          "for salg. Regner lokalt i nettleseren. Måleren og stempelet bruker " +
          "bokas fargesoner (rosa, gul, grønn).",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <GrowthCalculator {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof GrowthCalculator>;

export const Lonnsomhet: Story = {
  name: "Lønnsomhet",
  args: {
    eyebrow: "Tall",
    title: "Tjener du penger på det du selger?",
    intro:
      "Pris minus alle kostnader, delt på prisen. Boka regner 30–60 % som god lønnsomhet.",
    calculator: "profit",
    profit: { example: PROFIT_EXAMPLE },
    footnote: "Tallene blir i nettleseren din.",
    link: { label: "Les mer i kapittel T", href: "#" },
    palette: BOOK_PALETTE,
  },
};

export const Timepris: Story = {
  args: {
    eyebrow: "Tall",
    title: "Hva må timeprisen din være?",
    calculator: "hourly",
    hourly: { multiplier: 1.5 },
    palette: BOOK_PALETTE,
  },
};

export const Spakula: Story = {
  name: "Spåkula for salg",
  args: {
    eyebrow: "Salg",
    title: "Spåkula for salg",
    intro:
      "Før inn inntektene du vet kommer og dem du antar kommer. Da ser du hvilke måneder som trenger ekstra salgsinnsats.",
    calculator: "forecast",
    forecast: { monthlyNeed: FORECAST_MONTHLY_NEED },
    palette: BOOK_PALETTE,
  },
};
