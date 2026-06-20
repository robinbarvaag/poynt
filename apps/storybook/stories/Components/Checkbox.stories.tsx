import { Checkbox, Label } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

const meta = {
  title: "Komponenter/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { size: "md" },
  argTypes: {
    size: { control: { type: "select" }, options: ["sm", "md", "lg"] },
  },
};

export const MedLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2.5">
      <Checkbox id="vilkar" />
      <Label htmlFor="vilkar">Jeg godtar vilkårene</Label>
    </div>
  ),
};

export const Størrelser: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Checkbox size="sm" defaultChecked />
      <Checkbox size="md" defaultChecked />
      <Checkbox size="lg" defaultChecked />
    </div>
  ),
};

export const Avkrysset: Story = {
  render: () => <Checkbox defaultChecked />,
};

export const Deaktivert: Story = {
  render: () => <Checkbox disabled />,
};

// Interaksjonstest: en uavkrysset boks skal bli avkrysset når den klikkes.
export const ToggleTest: Story = {
  name: "Test: huk av/på",
  render: () => <Checkbox aria-label="Samtykke" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox");
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
    await userEvent.click(box);
    await expect(box).not.toBeChecked();
  },
};
