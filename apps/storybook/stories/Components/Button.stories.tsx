import { Button, Icon } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Merkevareknappene (default/saffron/salmon/ink) har et lekent sveip: " +
          "en aksent-flate ligger forskjøvet bak som en hard skygge og sklir inn " +
          "og dekker hele knappen ved hover, mens tekstfargen bytter. HOLD MUSA " +
          "OVER for å se det. Nøytrale verktøy-varianter (outline/ghost/…) er " +
          "uendret. Bygget med pseudo-elementer, så `asChild` fortsatt funker.",
      },
    },
  },
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
        "saffron",
        "salmon",
        "ink",
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

export const Merkevare: Story = {
  name: "Merkevare (sveip — hold musa over)",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <Button variant="default" size="lg">
        Bli medlem
      </Button>
      <Button variant="saffron" size="lg">
        Se kursene
      </Button>
      <Button variant="salmon" size="lg">
        Prøv gratis
      </Button>
      <Button variant="ink" size="lg">
        Logg inn
      </Button>
    </div>
  ),
};

export const Verktoy: Story = {
  name: "Verktøy-varianter",
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
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
