import { StatsBand } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof StatsBand> = {
  title: "Blokker/StatsBand",
  component: StatsBand,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Modig tall-/bevis-bånd. En mettet fargeflate med store tall som teller " +
          "rolig opp når de kommer i viewport (myk easing). Selv-styrt seksjon, " +
          "som CTA — plasseres direkte, ikke i BlockSection.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof StatsBand>;

export const Primary: Story = {
  args: {
    eyebrow: "I tall",
    title: "Et fellesskap i vekst",
    variant: "primary",
    stats: [
      { value: 99, suffix: "+", label: "kurs" },
      { value: 10, suffix: "k+", label: "medlemmer" },
      { value: 12, suffix: "+", label: "AI-verktøy" },
      { value: 4, suffix: ".9", label: "snittvurdering" },
    ],
  },
};

export const Saffron: Story = {
  args: {
    variant: "saffron",
    stats: [
      { value: 99, suffix: "+", label: "kurs" },
      { value: 10, suffix: "k+", label: "medlemmer" },
      { value: 12, suffix: "+", label: "AI-verktøy" },
    ],
  },
};
