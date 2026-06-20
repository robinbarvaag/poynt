import { type TestimonialItem, Testimonials } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const avatar = (seed: string) => (
  <img
    src={`https://i.pravatar.cc/120?img=${seed}`}
    alt=""
    className="size-full object-cover"
  />
);

const testimonials: TestimonialItem[] = [
  {
    id: 1,
    quote:
      "Hun gikk rett inn i styret og løftet de strategiske diskusjonene fra dag én. Skarp, godt forberedt og tydelig.",
    author: "Marte Hansen",
    role: "Styreleder",
    company: "Nordvik AS",
    rating: 5,
    avatar: avatar("32"),
  },
  {
    id: 2,
    quote:
      "On Poynt-medlemskapet har gitt oss verktøyene og strukturen vi manglet. Vi sparer timer hver eneste uke.",
    author: "Jonas Berg",
    role: "Gründer",
    company: "Tindra Studio",
    rating: 5,
    avatar: avatar("12"),
  },
  {
    id: 3,
    quote:
      "Et sjeldent blikk for både forretning og mennesker. Rådene hennes har formet hele veksten vår.",
    author: "Sofie Lund",
    role: "Daglig leder",
    company: "Fjordlys",
    avatar: avatar("45"),
  },
];

const meta = {
  title: "Blokker/Testimonials",
  component: Testimonials,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Testimonials>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <Testimonials
        eyebrow="Kundehistorier"
        title="Hva andre sier"
        intro="Et knippe ord fra styrer, gründere og selskaper hun har jobbet med."
        testimonials={testimonials}
      />
    </div>
  ),
};

export const ToKolonner: Story = {
  name: "To kolonner",
  render: () => (
    <div className="mx-auto max-w-4xl p-8">
      <Testimonials columns={2} testimonials={testimonials.slice(0, 2)} />
    </div>
  ),
};

export const UtenRating: Story = {
  name: "Uten rating (initialer)",
  render: () => (
    <div className="mx-auto max-w-6xl p-8">
      <Testimonials
        testimonials={testimonials.map((t) => ({
          id: t.id,
          quote: t.quote,
          author: t.author,
          role: t.role,
          company: t.company,
        }))}
      />
    </div>
  ),
};

export const StortSitat: Story = {
  name: "Stort sitat (quote)",
  render: () => (
    <div className="mx-auto max-w-5xl p-8">
      <Testimonials
        layout="quote"
        eyebrow="Kundehistorier"
        testimonials={testimonials}
      />
    </div>
  ),
};
