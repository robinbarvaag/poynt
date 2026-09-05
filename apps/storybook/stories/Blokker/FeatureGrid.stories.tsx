import { FeatureGrid, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof FeatureGrid> = {
  title: "Blokker/FeatureGrid",
  component: FeatureGrid,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Verdi-/feature-rutenett i modig fargeblokk-stil (INSPO/PayPal). Hvert " +
          "kort er en hel mettet flate med stor line-art-ikon, fet tittel med " +
          "aksent-stjerne, tynn skillelinje og enten en lenke eller et nøkkeltall. " +
          "Kortene er bevisst varierte — ikke tre identiske bokser.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof FeatureGrid>;

export const Standard: Story = {
  render: (args) => (
    <Section spacing="lg">
      <FeatureGrid {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Hvorfor Poynt",
    title: "Alt du trenger for å komme videre",
    intro: "Læring, verktøy og fellesskap — samlet ett sted.",
    columns: 3,
    features: [
      {
        title: "Lær i ditt tempo*",
        text: "Strukturerte kurs som tar deg fra nybegynner til trygg — når det passer deg.",
        link: { label: "Se kursene", href: "#" },
      },
      {
        title: "AI-verktøy som jobber*",
        text: "La verktøyene gjøre grovjobben, fra idé til ferdig resultat på minutter.",
        stat: { value: "12+", label: "verktøy klare" },
      },
      {
        title: "Et fellesskap i ryggen*",
        text: "Del, få tilbakemelding og voks sammen med andre på samme reise.",
        link: { label: "Bli medlem", href: "#" },
      },
    ],
  },
};

export const FireKolonner: Story = {
  name: "Fire kolonner",
  render: (args) => (
    <Section spacing="lg">
      <FeatureGrid {...args} />
    </Section>
  ),
  args: {
    title: "Bygget for å ta deg videre",
    columns: 4,
    features: [
      {
        title: "Kurs*",
        text: "Lær i ditt eget tempo, steg for steg.",
      },
      {
        title: "AI-verktøy*",
        text: "Fra plan til konkret resultat.",
      },
      {
        title: "Fellesskap*",
        text: "Del og voks sammen med andre.",
      },
      {
        title: "Maler*",
        text: "Kom i gang med fart fra dag én.",
      },
    ],
  },
};
