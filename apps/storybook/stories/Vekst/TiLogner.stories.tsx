import { MythCards, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import { MYTHS } from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof MythCards> = {
  title: "Vekst/Ti løgner",
  component: MythCards,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Løgnene som hindrer vekst, som vendekort. Klikk snur kortet; når " +
          "alle er avslørt kommer et lite konfetti-smell.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <MythCards {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof MythCards>;

export const Standard: Story = {
  args: {
    eyebrow: "Del 3",
    title: "Ti løgner som kan hindre vekst",
    intro: "Snu kortene og se hva som faktisk stemmer.",
    myths: MYTHS,
    link: { label: "Les hele kapittelet i boka", href: "#" },
    palette: BOOK_PALETTE,
  },
};
