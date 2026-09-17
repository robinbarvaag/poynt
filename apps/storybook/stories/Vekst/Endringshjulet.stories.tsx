import { ChangeWheel, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import {
  CHANGE_WHEEL_AI_PROMPT,
  CHANGE_WHEEL_AREAS,
} from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof ChangeWheel> = {
  title: "Vekst/Endringshjulet",
  component: ChangeWheel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Endringshjulet fra boka, tegnet som en blink. Fire områder med tre " +
          "ja/nei-spørsmål hver. Du svarer på ett område om gangen mens blinken " +
          "står synlig, og hvert område fylles fra ytterkanten og innover: alle " +
          "ja tar det helt inn i blinken. Til slutt får du en prioritert plan.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <ChangeWheel {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof ChangeWheel>;

export const Standard: Story = {
  args: {
    eyebrow: "Endring",
    title: "Hvor bør du starte?",
    intro:
      "Svar ja eller nei på tolv spørsmål, så ser du hvilket område du bør ta tak i først.",
    areas: CHANGE_WHEEL_AREAS,
    aiPrompt: CHANGE_WHEEL_AI_PROMPT,
    palette: BOOK_PALETTE,
  },
};

/** Mobilbredde: blinken klistrer seg øverst mens du svarer. */
export const Mobil: Story = {
  ...Standard,
  parameters: { viewport: { defaultViewport: "mobile1" } },
};

/** To områder med fire spørsmål hver, uten lenker. */
export const ToOmrader: Story = {
  args: {
    title: "Er du klar for vekst?",
    areas: [
      {
        name: "Salg",
        questions: [
          "Har du fast tid til salg i kalenderen?",
          "Vet du hvor de siste kundene kom fra?",
          "Følger du opp tilbudene du sender?",
          "Selger du hele året?",
        ],
        advice: "Sett av én halv dag i uka til salg, og kall den noe.",
      },
      {
        name: "Tall",
        questions: [
          "Vet du lønnsomheten på hovedproduktet?",
          "Vet du hva du må ha inn hver måned?",
          "Sjekker du regnskapet hver uke?",
          "Har du en buffer?",
        ],
        advice:
          "Start med å regne ut hva du må ha inn hver måned for å gå i null.",
      },
    ],
    palette: BOOK_PALETTE,
  },
};
