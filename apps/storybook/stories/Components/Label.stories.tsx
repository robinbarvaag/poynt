import { Input, Label } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Ledetekst som beskriver et skjemafelt. Knyttes til feltet med htmlFor slik at det blir tilgjengelig for skjermlesere og klikkbart.",
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-[280px] gap-2">
      <Label htmlFor="epost">E-post</Label>
      <Input id="epost" type="email" placeholder="navn@eksempel.no" />
    </div>
  ),
};
