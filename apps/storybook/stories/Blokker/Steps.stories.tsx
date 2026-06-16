import { Section, Steps } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Steps> = {
  title: "Blokker/Steps",
  component: Steps,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "«Slik funker det» — reisen nedover siden som en redaksjonell zig-zag. " +
          "Gigantiske tall som anker (ingen ikoner), vekslende side for bevegelse " +
          "og en marker-strek som aksent. Hvert steg glir inn ved scroll.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Steps>;

export const SlikFunkerDet: Story = {
  name: "Slik funker det",
  render: (args) => (
    <Section spacing="lg">
      <Steps {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Kom i gang",
    title: "Slik funker det",
    intro: "Tre steg fra nysgjerrig til i gang.",
    steps: [
      {
        title: "Lær",
        text: "Velg et kurs og lær i ditt eget tempo, med innhold som tar deg steg for steg.",
      },
      {
        title: "Bruk verktøyene",
        text: "Sett kunnskapen i arbeid med AI-verktøy som gjør jobben konkret.",
      },
      {
        title: "Bli sett",
        text: "Del resultatene, få tilbakemelding og voks sammen med fellesskapet.",
      },
    ],
  },
};
