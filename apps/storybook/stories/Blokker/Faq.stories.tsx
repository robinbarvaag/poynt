import { Faq, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Faq> = {
  title: "Blokker/Faq",
  component: Faq,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "FAQ bygget på Accordion-en, med den ikon-frie +/−-markøren (ny " +
          '`indicator="plus"`-prop). Én åpen om gangen.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Faq>;

export const Standard: Story = {
  render: (args) => (
    <Section spacing="lg">
      <Faq {...args} />
    </Section>
  ),
  args: {
    eyebrow: "Spørsmål",
    title: "Ofte stilte spørsmål",
    intro: "Finner du ikke svaret? Ta kontakt, så hjelper vi deg.",
    defaultOpen: 0,
    items: [
      {
        question: "Hvordan kommer jeg i gang?",
        answer:
          "Du oppretter en gratis konto, velger et kurs og er i gang på minutter. Ingen binding, og du kan oppgradere når som helst.",
      },
      {
        question: "Kan jeg si opp når jeg vil?",
        answer:
          "Ja. Medlemskapet er uten binding — du kan si opp når som helst, og beholder tilgangen ut perioden du har betalt for.",
      },
      {
        question: "Hva er forskjellen på Community og Community + AI?",
        answer:
          "Community gir deg alle kurs, maler og fellesskapet. Community + AI legger til alle AI-verktøyene og prioritert support.",
      },
      {
        question: "Får jeg tilgang til nytt innhold?",
        answer:
          "Ja, alt nytt innhold inkluderes i medlemskapet ditt så lenge du er medlem.",
      },
    ],
  },
};
