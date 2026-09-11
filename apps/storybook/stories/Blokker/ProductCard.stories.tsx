import { ProductCard } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/600/450`}
    alt=""
    className="size-full object-cover"
  />
);

const meta = {
  title: "Blokker/ProductCard",
  component: ProductCard,
  parameters: { layout: "centered" },
  args: {
    href: "#",
    name: "Bygg en nettside fra bunnen",
    eyebrow: "Kurs",
    shortDescription: "Lær HTML, CSS og litt JavaScript — steg for steg.",
    price: 1490,
    image: img("kurs"),
  },
  argTypes: {
    surface: {
      control: { type: "select" },
      options: ["default", "saffron", "salmon", "mint"],
    },
    featured: { control: { type: "boolean" } },
    image: { control: false },
  },
} satisfies Meta<typeof ProductCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <ProductCard {...args} />
    </div>
  ),
};

export const Tinter: Story = {
  name: "Fargeblokk-tinter",
  parameters: { layout: "padded" },
  render: () => (
    <div className="grid max-w-[1000px] grid-cols-3 gap-5">
      <ProductCard
        href="#"
        surface="saffron"
        eyebrow="Kurs"
        name="Design som selger"
        price={1290}
        image={img("a")}
      />
      <ProductCard
        href="#"
        surface="salmon"
        eyebrow="PDF"
        name="Sjekkliste for lansering"
        price={199}
        image={img("b")}
      />
      <ProductCard
        href="#"
        surface="mint"
        eyebrow="Pakke"
        name="Alt-i-ett startpakke"
        price={2490}
        compareAtPrice={2990}
        image={img("c")}
      />
    </div>
  ),
};

export const Fremhevet: Story = {
  name: "Fremhevet (2 kolonner)",
  parameters: { layout: "padded" },
  render: (args) => (
    <div className="grid max-w-[1000px] grid-cols-3 gap-5">
      <ProductCard {...args} featured surface="saffron" />
      <ProductCard
        href="#"
        surface="salmon"
        eyebrow="PDF"
        name="Sjekkliste"
        price={199}
        image={img("d")}
      />
    </div>
  ),
};

export const MedRabatt: Story = {
  name: "Med rabatt",
  render: (args) => (
    <div className="w-[320px]">
      <ProductCard
        {...args}
        surface="saffron"
        price={990}
        compareAtPrice={1490}
      />
    </div>
  ),
};

export const UtenBilde: Story = {
  name: "Uten bilde",
  render: (args) => (
    <div className="w-[320px]">
      <ProductCard {...args} image={undefined} />
    </div>
  ),
};
