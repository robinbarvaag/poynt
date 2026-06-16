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
          "Verdi-/feature-rutenett («hvorfor Poynt»). Innholds-only blokk som " +
          "pakkes i seksjonsrytmen i appen. Roterende tint på ikon-chipene gir " +
          "liv, kortene løftes på hover og staggrer inn ved scroll.",
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
        icon: "graduation-cap",
        title: "Kurs i ditt tempo",
        text: "Strukturerte kurs som tar deg fra nybegynner til trygg — når det passer deg.",
      },
      {
        icon: "sparkles",
        title: "AI-verktøy som jobber",
        text: "La verktøyene gjøre grovjobben, fra idé til ferdig resultat.",
      },
      {
        icon: "users",
        title: "Et fellesskap i ryggen",
        text: "Del, få tilbakemelding og voks sammen med andre på samme reise.",
      },
    ],
  },
};

export const FireKolonner: Story = {
  name: "Fire kolonner (dempet flate)",
  render: (args) => (
    <Section variant="muted" spacing="lg">
      <FeatureGrid {...args} />
    </Section>
  ),
  args: {
    title: "Bygget for å ta deg videre",
    columns: 4,
    features: [
      {
        icon: "graduation-cap",
        title: "Kurs",
        text: "Lær i ditt eget tempo, steg for steg.",
      },
      {
        icon: "sparkles",
        title: "AI-verktøy",
        text: "Fra plan til konkret resultat.",
      },
      {
        icon: "users",
        title: "Fellesskap",
        text: "Del og voks sammen med andre.",
      },
      {
        icon: "rocket",
        title: "Maler",
        text: "Kom i gang med fart fra dag én.",
      },
    ],
  },
};
