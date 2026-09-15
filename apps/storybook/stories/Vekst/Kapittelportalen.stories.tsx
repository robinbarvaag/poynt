import { ChapterPortal, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import { CHAPTER_DOORS } from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof ChapterPortal> = {
  title: "Vekst/Kapittelportalen",
  component: ChapterPortal,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Én dør per bokstav i VEKST. Døra svinger opp ved hover og fokus, og " +
          "dører du har gått gjennom står på gløtt med en hake.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <ChapterPortal {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof ChapterPortal>;

export const Standard: Story = {
  args: {
    eyebrow: "Verdifull vekst",
    title: "Velg en dør",
    intro: "Hvert kapittel i boka har et verktøy du kan prøve her.",
    doors: CHAPTER_DOORS,
    palette: BOOK_PALETTE,
  },
};
