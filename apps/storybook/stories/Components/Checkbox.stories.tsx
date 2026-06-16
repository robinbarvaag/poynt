import { Checkbox, Label } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Avkrysningsboks for å slå et valg av eller på. Brukes for samtykker, filtre og når brukeren kan velge flere alternativer samtidig.",
      },
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Checkbox />,
};

export const MedLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="vilkar" />
      <Label htmlFor="vilkar">Jeg godtar vilkårene</Label>
    </div>
  ),
};

export const Avkrysset: Story = {
  render: () => <Checkbox defaultChecked />,
};

export const Deaktivert: Story = {
  render: () => <Checkbox disabled />,
};
