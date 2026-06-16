import { Label, Textarea } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Flerlinjes tekstfelt for lengre innhold som kommentarer, beskrivelser og meldinger. Brukes når ett enkelt inndatafelt ikke gir nok plass.",
      },
    },
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Textarea placeholder="Skriv en melding ..." className="w-[320px]" />
  ),
};

export const MedLabel: Story = {
  render: () => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="melding">Melding</Label>
      <Textarea id="melding" placeholder="Skriv en melding ..." />
    </div>
  ),
};
