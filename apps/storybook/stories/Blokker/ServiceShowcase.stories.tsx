import { ServiceShowcase, type ServiceShowcaseItem } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

const img = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/600/450`}
    alt=""
    className="size-full object-cover"
  />
);

const services: ServiceShowcaseItem[] = [
  {
    id: 1,
    name: "Rådgiving",
    price: "5 000 kr + mva",
    description:
      "Utnytt kunnskapen min i to timer, og få svar på det du lurer på om markedsføring eller kommunikasjon. Leveres kun digitalt.",
    image: img("rad"),
    ctaLabel: "Ta kontakt",
    ctaHref: "#",
  },
  {
    id: 2,
    name: "Innholdsproduksjon",
    price: "15 000 kr + mva",
    description:
      "Passer for deg som trenger bilder og video til bruk i sosiale medier. Jeg lager innhold i to timer, og du har full råderett over alt innholdet i etterkant.",
    image: img("innhold"),
    ctaLabel: "Ta kontakt",
    ctaHref: "#",
  },
  {
    id: 3,
    name: "Workshop for styret",
    price: "30 000 kr + mva",
    description:
      "Perfekt for deg som sitter i et styre og ønsker deg en skreddersydd oppdatering om AI, markedsføring og kommunikasjon.",
    image: img("styre"),
    ctaLabel: "Ta kontakt",
    ctaHref: "#",
  },
];

function Demo() {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  return (
    <div className="mx-auto max-w-5xl p-8">
      <ServiceShowcase
        services={services}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={() => setActiveId(null)}
      />
    </div>
  );
}

const meta = {
  title: "Blokker/ServiceShowcase",
  component: ServiceShowcase,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ServiceShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => <Demo />,
};
