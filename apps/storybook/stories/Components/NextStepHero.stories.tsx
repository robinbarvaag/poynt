import { NextStepHero } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/NextStepHero",
  component: NextStepHero,
  parameters: { layout: "padded" },
} satisfies Meta<typeof NextStepHero>;

export default meta;

type Story = StoryObj<typeof meta>;

// Tilstandsstyrt topp: hvor du er + det ene neste steget, tonet i fasefargen.
export const AktivFase: Story = {
  name: "Aktiv fase",
  args: {
    eyebrow: "Neste steg",
    title: "På tide å finne retningen",
    body: "Vi finner kanalene som passer bedriften din, og lager en plan du kan følge.",
    accent: "saffron",
    primary: { label: "Lag markedsplan", href: "#", icon: "bar-chart" },
    secondary: { label: "Finn kanaler", href: "#", icon: "compass" },
  },
};

export const Ferdig: Story = {
  args: {
    eyebrow: "Du er i gang",
    title: "Alt er på plass — nå holder vi rytmen",
    body: "Oppsettet er ferdig. Hold deg til ukerytmen, og se over planen hvert kvartal.",
    accent: "primary",
    primary: { label: "Se kommende innlegg", href: "#", icon: "calendar-days" },
    secondary: { label: "Se planen", href: "#" },
  },
};
