import { Button, Container, FormSuccess } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/FormSuccess",
  component: FormSuccess,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <Container size="sm">
        <div className="py-16">
          <Story />
        </div>
      </Container>
    ),
  ],
  argTypes: {
    title: { control: { type: "text" } },
    message: { control: { type: "text" } },
    tone: {
      control: { type: "select" },
      options: ["primary", "mint", "saffron"],
    },
    icon: {
      control: { type: "select" },
      options: ["check-circle", "sparkles", "check", "trophy", "rocket"],
    },
    animate: { control: { type: "boolean" } },
    decoration: {
      control: { type: "inline-radio" },
      options: ["rich", "soft", "none"],
    },
  },
} satisfies Meta<typeof FormSuccess>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Takk for din melding!",
    message:
      "Vi har mottatt søknaden din og tar kontakt så snart vi har sett på den.",
    tone: "primary",
    icon: "check-circle",
    animate: true,
    decoration: "rich",
  },
};

export const Toner: Story = {
  name: "Fargetoner",
  render: () => (
    <div className="space-y-8">
      <FormSuccess tone="primary" message="Tone: primary" />
      <FormSuccess tone="mint" message="Tone: mint" />
      <FormSuccess tone="saffron" message="Tone: saffron" />
    </div>
  ),
};

export const Dekornivaaer: Story = {
  name: "Dekor-nivåer",
  render: () => (
    <div className="space-y-8">
      <FormSuccess decoration="rich" message="decoration: rich" />
      <FormSuccess decoration="soft" message="decoration: soft" />
      <FormSuccess decoration="none" message="decoration: none" />
    </div>
  ),
};

export const MedHandling: Story = {
  name: "Med handling",
  args: {
    title: "Søknaden er sendt!",
    message: "Du hører fra oss innen to virkedager.",
    action: (
      <Button type="button" variant="outline">
        Tilbake til forsiden
      </Button>
    ),
  },
};

export const UtenBevegelse: Story = {
  name: "Uten bevegelse",
  args: {
    title: "Takk for din melding!",
    message:
      "Animasjon og dekor er slått av (f.eks. ved «prefers-reduced-motion»).",
    animate: false,
    decoration: "none",
  },
};
