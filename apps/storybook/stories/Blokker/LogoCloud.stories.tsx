import { LogoCloud, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof LogoCloud> = {
  title: "Blokker/LogoCloud",
  component: LogoCloud,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Logo-/bevis-stripe («brukt av», «som omtalt i»). Uten bilde vises " +
          "navnet som en dempet wordmark (ingen ikoner), som lyser opp på hover.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof LogoCloud>;

export const Wordmarks: Story = {
  render: (args) => (
    <Section variant="muted" spacing="md">
      <LogoCloud {...args} />
    </Section>
  ),
  args: {
    label: "Brukt av folk fra",
    logos: [
      { name: "Nordlys" },
      { name: "Fjordkraft" },
      { name: "Bytek" },
      { name: "Lumen" },
      { name: "Solstrøm" },
    ],
  },
};
