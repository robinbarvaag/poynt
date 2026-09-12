import { Button, ProductSpotlight } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/600/750`}
    alt=""
    className="size-full object-contain"
  />
);

const meta = {
  title: "Blokker/ProductSpotlight",
  component: ProductSpotlight,
  parameters: { layout: "padded" },
  args: {
    href: "#",
    name: "Bygg en nettside fra bunnen",
    eyebrow: "Anbefalt",
    description:
      "Kurset jeg viser til i dette innlegget – HTML, CSS og litt JavaScript, steg for steg.",
    price: 1490,
    image: img("spotlight"),
    action: <Button size="lg">Legg i handlekurv</Button>,
  },
  argTypes: {
    accent: {
      control: { type: "select" },
      options: ["saffron", "salmon", "mint"],
    },
    image: { control: false },
    action: { control: false },
  },
} satisfies Meta<typeof ProductSpotlight>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Slik kortet står midt i et blogginnlegg (artikkelbredde). */
export const Default: Story = {
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <ProductSpotlight {...args} />
    </div>
  ),
};

export const UtenKjopsknapp: Story = {
  name: "Uten kjøpsknapp",
  args: {
    eyebrow: "Bok",
    name: "Boka: Snakk så barna lytter",
    description: "Har varianter – kjøpet skjer på produktsiden.",
    badge: { label: "Forhåndssalg", tone: "presale" },
    price: 349,
    compareAtPrice: 399,
    action: undefined,
    image: img("bok"),
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <ProductSpotlight {...args} />
    </div>
  ),
};

export const UtenBilde: Story = {
  name: "Uten bilde",
  args: {
    image: undefined,
    eyebrow: "PDF",
    name: "Sjekkliste for lansering",
    price: 199,
  },
  render: (args) => (
    <div className="mx-auto max-w-3xl">
      <ProductSpotlight {...args} />
    </div>
  ),
};
