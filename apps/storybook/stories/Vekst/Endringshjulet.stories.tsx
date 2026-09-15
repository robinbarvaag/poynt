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
          "Endringshjulet fra boka: fire områder med tre ja/nei-spørsmål hver. " +
          "Når alt er besvart roterer hjulet så det svakeste området står øverst.",
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
      "Svar ja eller nei på tolv spørsmål. 0–1 ja blir rosa, 2 ja gult og 3 ja grønt.",
    areas: CHANGE_WHEEL_AREAS,
    aiPrompt: CHANGE_WHEEL_AI_PROMPT,
    palette: BOOK_PALETTE,
  },
};
