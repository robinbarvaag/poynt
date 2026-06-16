import { Separator } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Separator",
  component: Separator,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Tynn skillelinje som grupperer eller deler innhold visuelt. Brukes mellom seksjoner, menyvalg eller ved siden av hverandre i en rad.",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horisontal: Story = {
  render: () => (
    <div className="w-[280px]">
      <p className="text-sm">Profilinnstillinger</p>
      <Separator className="my-3" />
      <p className="text-sm">Varslingsinnstillinger</p>
    </div>
  ),
};

export const Vertikal: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Forside</span>
      <Separator orientation="vertical" />
      <span>Blogg</span>
      <Separator orientation="vertical" />
      <span>Kontakt</span>
    </div>
  ),
};
