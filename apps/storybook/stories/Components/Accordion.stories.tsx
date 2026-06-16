import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-[400px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Hva inngår i medlemskapet?</AccordionTrigger>
        <AccordionContent>
          Medlemskapet gir deg tilgang til alle kurs, verktøy og fellesskapet
          vårt.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Kan jeg avslutte når som helst?</AccordionTrigger>
        <AccordionContent>
          Ja, du kan avslutte medlemskapet ditt når som helst uten ekstra
          kostnader.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Hvordan betaler jeg?</AccordionTrigger>
        <AccordionContent>
          Du betaler trygt med kort, og fakturaen sendes automatisk til e-posten
          din.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
