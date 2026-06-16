import { ContentMedia, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof ContentMedia> = {
  title: "Blokker/ContentMedia",
  component: ContentMedia,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Redaksjonell tekst + media-split med bevisst asymmetri (5/6-kolonner, " +
          "forskjøvet fra midten). Mediet er en slot, så appen kan sende et " +
          "next/Image. Snu siden med `mediaSide`.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ContentMedia>;

// Plassholder-media (i appen sendes et ekte bilde inn via slot).
const placeholder = (
  <div className="size-full bg-linear-to-br from-primary/25 via-mint/40 to-saffron/40" />
);

export const MediaHoyre: Story = {
  name: "Media til høyre",
  render: (args) => (
    <Section spacing="lg">
      <ContentMedia {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Læring",
    title: "Lær i ditt eget tempo",
    body: "Kurs og innhold bygget for å ta deg videre, steg for steg — uten stress, når det passer deg.",
    bullets: [
      "Strukturerte moduler du kan ta når du vil",
      "Praktiske oppgaver med tilbakemelding",
      "Last ned maler og verktøy underveis",
    ],
    cta: { text: "Utforsk kursene", href: "#" },
    media: placeholder,
    mediaSide: "right",
    accent: "saffron",
  },
};

export const MediaVenstre: Story = {
  name: "Media til venstre (dempet flate)",
  render: (args) => (
    <Section variant="muted" spacing="lg">
      <ContentMedia {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Verktøy",
    title: "Verktøy som gjør jobben",
    body: "AI-drevne verktøy som tar deg fra plan til konkret resultat på minutter.",
    bullets: [
      "Ferdige oppskrifter for vanlige oppgaver",
      "Tilpasset ditt fagfelt og din stemme",
    ],
    cta: { text: "Se verktøyene", href: "#" },
    media: placeholder,
    mediaSide: "left",
    accent: "salmon",
  },
};
