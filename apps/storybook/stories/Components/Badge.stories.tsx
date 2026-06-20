import { Badge } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Badge",
  component: Badge,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
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
        "saffron",
        "salmon",
        "mint",
        "soft-primary",
        "soft-saffron",
        "soft-salmon",
        "soft-destructive",
      ],
    },
    size: {
      control: { type: "select" },
      options: ["sm", "md", "lg", "xl"],
    },
    dot: { control: { type: "boolean" } },
  },
};

export const Solide: Story = {
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

export const MerkevareToner: Story = {
  name: "Merkevare-toner",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="saffron">saffron</Badge>
      <Badge variant="salmon">salmon</Badge>
      <Badge variant="mint">mint</Badge>
    </div>
  ),
};

export const MykeToner: Story = {
  name: "Myke/tonale",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="soft-primary">soft-primary</Badge>
      <Badge variant="soft-saffron">soft-saffron</Badge>
      <Badge variant="soft-salmon">soft-salmon</Badge>
      <Badge variant="soft-destructive">soft-destructive</Badge>
    </div>
  ),
};

export const Størrelser: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge size="sm">Liten</Badge>
      <Badge size="md">Standard</Badge>
      <Badge size="lg">Stor</Badge>
      <Badge size="xl">Ekstra stor</Badge>
    </div>
  ),
};

export const MedDot: Story = {
  name: "Med statusprikk",
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge dot variant="soft-primary" size="lg">
        Aktiv
      </Badge>
      <Badge dot variant="soft-saffron" size="lg">
        Venter
      </Badge>
      <Badge dot variant="destructive" size="lg">
        Utløpt
      </Badge>
    </div>
  ),
};
