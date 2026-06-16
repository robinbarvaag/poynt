import { Input, Label } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Skriv her...",
  },
};

export const MedLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="epost">E-post</Label>
      <Input id="epost" type="email" placeholder="navn@eksempel.no" />
    </div>
  ),
};

export const Deaktivert: Story = {
  args: {
    disabled: true,
    placeholder: "Deaktivert",
  },
};
