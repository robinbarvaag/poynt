import { Section, VekstCheck } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import { VEKST_PILLARS } from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof VekstCheck> = {
  title: "Vekst/VEKST-sjekken",
  component: VekstCheck,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Ett ja/nei-spørsmål om gangen. Bokstavklossene fylles opp med " +
          "bokfarge for hvert ja, og den sterkeste løftes fram til slutt.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <VekstCheck {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof VekstCheck>;

export const Standard: Story = {
  args: {
    eyebrow: "VEKST-modellen",
    title: "Hvor står bedriften din?",
    intro: "Femten korte spørsmål. Ta dem på magefølelsen.",
    pillars: VEKST_PILLARS,
    palette: BOOK_PALETTE,
  },
};
