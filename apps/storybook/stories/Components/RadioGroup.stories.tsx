import { Label, RadioGroup, RadioGroupItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Radioknapper lar brukeren velge ett alternativ fra en liste. Brukes når valgene utelukker hverandre og alle alternativene bør vises samtidig.",
      },
    },
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="manedlig">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="manedlig" id="manedlig" />
        <Label htmlFor="manedlig">Månedlig</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="kvartal" id="kvartal" />
        <Label htmlFor="kvartal">Kvartalsvis</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="arlig" id="arlig" />
        <Label htmlFor="arlig">Årlig</Label>
      </div>
    </RadioGroup>
  ),
};
