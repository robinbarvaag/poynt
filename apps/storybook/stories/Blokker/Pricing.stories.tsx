import { Pricing, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Pricing> = {
  title: "Blokker/Pricing",
  component: Pricing,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Pris-/medlemskapsblokk. Kort per plan med én fremhevet anbefaling. " +
          "Funksjoner markeres med en tynn strek (ingen ikoner), kortene er " +
          "squircle og CTA-en arver merkevareknappen.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Pricing>;

export const Medlemskap: Story = {
  render: (args) => (
    <Section spacing="lg">
      <Pricing {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Medlemskap",
    title: "Velg planen som passer deg",
    intro: "Start gratis, oppgrader når du er klar. Ingen binding.",
    tiers: [
      {
        name: "Gratis",
        price: "0",
        period: "kr",
        description: "Bli kjent med fellesskapet og smak på innholdet.",
        features: [
          "Tilgang til fellesskapet",
          "Utvalgte gratis-kurs",
          "Ukentlig nyhetsbrev",
        ],
        cta: { text: "Kom i gang", href: "#" },
      },
      {
        name: "Community",
        price: "149",
        period: "kr/mnd",
        description: "Alt du trenger for å lære og vokse.",
        features: [
          "Alle kurs og maler",
          "Fullt fellesskap med grupper",
          "Månedlige live-økter",
          "Last ned alt innhold",
        ],
        cta: { text: "Bli medlem", href: "#" },
        featured: true,
        badge: "Mest populær",
      },
      {
        name: "Community + AI",
        price: "249",
        period: "kr/mnd",
        description: "For deg som vil ha AI-verktøyene i tillegg.",
        features: [
          "Alt i Community",
          "Alle AI-verktøy",
          "Prioritert support",
          "Tidlig tilgang til nytt",
        ],
        cta: { text: "Få alt", href: "#" },
      },
    ],
  },
};
