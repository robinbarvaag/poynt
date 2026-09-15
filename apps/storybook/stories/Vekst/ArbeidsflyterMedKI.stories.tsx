import { AiWorkflow, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import { AI_WORKFLOWS } from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof AiWorkflow> = {
  title: "Vekst/Arbeidsflyter med KI",
  component: AiWorkflow,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Arbeidsflyter som små maskiner: input → prompt → resultat. «Kjør " +
          "eksempelet» skriver ut et forhåndsskrevet svar; ingen KI kalles.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <AiWorkflow {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof AiWorkflow>;

export const Standard: Story = {
  args: {
    eyebrow: "KI",
    title: "Arbeidsflyter med KI",
    intro: "Kopier prompten, eller åpne den rett i ChatGPT eller Claude.",
    workflows: AI_WORKFLOWS,
    palette: BOOK_PALETTE,
  },
};

export const FiktivtStyre: Story = {
  name: "Fiktivt styre (chatbobler)",
  args: {
    ...Standard.args,
    workflows: AI_WORKFLOWS.filter((w) => w.style === "board"),
  },
};
