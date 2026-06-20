import {
  Section,
  ServiceCard,
  ServiceGrid,
  type ServiceGridItem,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/600/450`}
    alt=""
    className="size-full object-cover"
  />
);

const services: ServiceGridItem[] = [
  {
    id: 1,
    href: "#",
    eyebrow: "Tjeneste",
    name: "Rådgiving",
    price: "5000 kr + mva",
    shortDescription:
      "Utnytt kunnskapen min i to timer, og få svar på det du lurer på om markedsføring eller kommunikasjon.",
    image: img("s1"),
  },
  {
    id: 2,
    href: "#",
    eyebrow: "Tjeneste",
    name: "Innholdsproduksjon",
    price: "15 000 kr + mva",
    shortDescription:
      "Passer for deg som trenger bilder og video til sosiale medier. Jeg lager innhold i to timer.",
    image: img("s2"),
  },
  {
    id: 3,
    href: "#",
    eyebrow: "Tjeneste",
    name: "Workshop for styret",
    price: "30 000 kr + mva",
    shortDescription:
      "Perfekt for deg som sitter i et styre og ønsker en skreddersydd oppdatering om AI og markedsføring.",
    image: img("s3"),
  },
  {
    id: 4,
    href: "#",
    eyebrow: "Tjeneste",
    name: "Medlemskap",
    price: "2000 kr / mnd",
    shortDescription:
      "Bli med i On Poynt for å skape vekst i din bedrift. Inspirasjon og oppdatert kunnskap om AI.",
    image: img("s4"),
  },
  {
    id: 5,
    href: "#",
    eyebrow: "Tjeneste",
    name: "Kurs/foredrag",
    price: "Ta kontakt for pris",
    shortDescription:
      "Få skreddersydd opplegg for din bedrift. Jeg har snakket for næringsforeninger over hele landet.",
    image: img("s5"),
  },
];

const meta = {
  title: "Blokker/ServiceGrid",
  component: ServiceGrid,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ServiceGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <Section variant="muted" spacing="md">
      <div className="mx-auto max-w-6xl px-4">
        <ServiceGrid services={services} />
      </div>
    </Section>
  ),
};

export const Enkeltkort: Story = {
  name: "Enkeltkort",
  parameters: { layout: "centered" },
  render: () => (
    <div className="w-[320px]">
      <ServiceCard {...services[0]} />
    </div>
  ),
};
