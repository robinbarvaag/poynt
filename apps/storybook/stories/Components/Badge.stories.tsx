import { Badge } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Badge",
  component: Badge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "Ny",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "secondary",
        "muted",
        "accent",
        "destructive",
        "outline",
      ],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "default", "lg"],
    },
  },
};

export const Varianter: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="default">default</Badge>
      <Badge variant="secondary">secondary</Badge>
      <Badge variant="muted">muted</Badge>
      <Badge variant="accent">accent</Badge>
      <Badge variant="destructive">destructive</Badge>
      <Badge variant="outline">outline</Badge>
    </div>
  ),
};

export const Størrelser: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge size="sm">Liten</Badge>
      <Badge size="default">Standard</Badge>
      <Badge size="lg">Stor</Badge>
    </div>
  ),
};
