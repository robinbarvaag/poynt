import { Hero, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Hero> = {
  title: "Blokker/Hero",
  component: Hero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Sidens store intro: badge, tittel med fremhevet ord, ingress, to " +
          "CTA-er og et bilde klippet i en organisk form. Pills flyter oppå " +
          "bildet, og nøkkeltallene under CTA-ene teller opp i viewport. Uten " +
          "`media` sentreres hele heroen.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Hero>;

// Ekte foto via Lorem Picsum (stabilt per seed). I appen sendes et next/Image
// inn i samme slot.
const photo = (
  <img
    src="https://picsum.photos/seed/poynt-hero/900/900"
    alt=""
    className="h-full w-full object-cover"
  />
);

export const Standard: Story = {
  render: (args) => (
    <Section spacing="lg">
      <Hero {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Salg og markedsføring",
    eyebrowIcon: "sparkles",
    title: (
      <>
        Markedsføring som <span className="text-primary">faktisk skjer</span>
      </>
    ),
    subtitle:
      "Kurs, verktøy og et fellesskap som hjelper deg fra gode intensjoner til publisert innhold.",
    primaryCta: { text: "Bli medlem", href: "#" },
    secondaryCta: { text: "Se hvordan det funker", href: "#" },
    media: photo,
    pills: [
      { label: "Ukentlige samlinger", icon: "users" },
      { label: "AI-verktøy", icon: "sparkles" },
    ],
    stats: [
      { value: 240, suffix: "+", label: "medlemmer" },
      { value: 30, suffix: " min", label: "til ferdig innlegg" },
    ],
  },
};

export const UtenBilde: Story = {
  name: "Uten bilde (sentrert)",
  render: (args) => (
    <Section spacing="lg">
      <Hero {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Om Poynt",
    title: "Vi gjør markedsføring mindre skummelt",
    subtitle: "Ingen store ord — bare konkrete grep du kan ta i bruk i dag.",
    primaryCta: { text: "Ta kontakt", href: "#" },
  },
};
