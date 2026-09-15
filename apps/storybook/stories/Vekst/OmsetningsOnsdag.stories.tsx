import { SalesRitual, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BOOK_PALETTE } from "../../../web/lib/book-brand";
import { SALES_RITUAL } from "../../../web/lib/vekst/book-content";

const meta: Meta<typeof SalesRitual> = {
  title: "Vekst/Omsetnings-onsdag",
  component: SalesRitual,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fast salgsøkt i uka. «Start økta» river av kalenderbladet, sjekklista " +
          "huskes i nettleseren og nullstilles hver uke.",
      },
    },
  },
  render: (args) => (
    <Section spacing="lg">
      <div className="mx-auto max-w-6xl px-4">
        <SalesRitual {...args} />
      </div>
    </Section>
  ),
};
export default meta;

type Story = StoryObj<typeof SalesRitual>;

export const Standard: Story = {
  args: {
    eyebrow: "Salg",
    title: "Omsetnings-onsdag",
    intro: "Halve onsdagen til salg, halve til markedsføring.",
    ritualName: SALES_RITUAL.ritualName,
    weekdayLabel: "onsdag",
    weekdayShort: "ONS",
    startTime: SALES_RITUAL.startTime,
    endTime: "13:00",
    checklist: SALES_RITUAL.checklist,
    quote: SALES_RITUAL.quote,
    calendarHref: "#",
    palette: BOOK_PALETTE,
  },
};
