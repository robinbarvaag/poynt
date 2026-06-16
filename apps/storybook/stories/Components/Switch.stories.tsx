import { Label, Switch } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Switch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Switch defaultChecked />,
};

export const MedLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="varsler" defaultChecked />
      <Label htmlFor="varsler">Varsler</Label>
    </div>
  ),
};
