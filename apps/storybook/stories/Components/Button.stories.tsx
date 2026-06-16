import { Button, Icon } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "default",
    children: "Klikk her",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg", "icon"],
    },
  },
};

export const Varianter: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Størrelser: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Liten</Button>
      <Button size="default">Standard</Button>
      <Button size="lg">Stor</Button>
    </div>
  ),
};

export const MedIkon: Story = {
  render: () => (
    <Button>
      <Icon name="sparkles" className="size-4 mr-2" />
      Med ikon
    </Button>
  ),
};

export const IkonKnapp: Story = {
  render: () => (
    <Button size="icon" variant="outline">
      <Icon name="plus" className="size-4" />
    </Button>
  ),
};
