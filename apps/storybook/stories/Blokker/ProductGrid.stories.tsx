import { ProductGrid, type ProductGridItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/600/450`}
    alt=""
    className="size-full object-cover"
  />
);

const products: ProductGridItem[] = [
  {
    id: 1,
    href: "#",
    eyebrow: "Kurs",
    name: "Bygg en nettside fra bunnen",
    shortDescription:
      "Lær HTML, CSS og litt JavaScript — steg for steg, i ditt eget tempo.",
    price: 1490,
    image: img("p1"),
  },
  {
    id: 2,
    href: "#",
    eyebrow: "PDF",
    name: "Sjekkliste for lansering",
    shortDescription: "Alt du må huske før du trykker publiser.",
    price: 199,
    image: img("p2"),
  },
  {
    id: 3,
    href: "#",
    eyebrow: "Pakke",
    name: "Alt-i-ett startpakke",
    shortDescription: "Kurs, maler og verktøy samlet til én pris.",
    price: 2490,
    compareAtPrice: 2990,
    image: img("p3"),
  },
  {
    id: 4,
    href: "#",
    eyebrow: "Kurs",
    name: "Design som selger",
    shortDescription: "Grunnleggende visuell kommunikasjon for ikke-designere.",
    price: 1290,
    image: img("p4"),
  },
  {
    id: 5,
    href: "#",
    eyebrow: "PDF",
    name: "Maler for sosiale medier",
    shortDescription: "30 ferdige oppsett du gjør til dine egne.",
    price: 349,
    image: img("p5"),
  },
];

const meta = {
  title: "Blokker/ProductGrid",
  component: ProductGrid,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ProductGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <ProductGrid products={products} />
    </div>
  ),
};

export const UtenFremhevet: Story = {
  name: "Uten fremhevet kort",
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <ProductGrid products={products} featureFirst={false} />
    </div>
  ),
};
