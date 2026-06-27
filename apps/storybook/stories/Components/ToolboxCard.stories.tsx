import { ToolboxCard } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/ToolboxCard",
  component: ToolboxCard,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ToolboxCard>;

export default meta;

type Story = StoryObj<typeof meta>;

// Et verktøy forklart slik en bruker forstår det: navn + hva + når.
export const Default: Story = {
  args: {
    name: "Si nei med stil",
    whatItDoes:
      "Lag høflige, profesjonelle avslag på forespørsler du ikke rekker.",
    whenToUse: "noen ber om noe du må takke nei til.",
    icon: "message-square-off",
    href: "#",
  },
};

export const MedTierMerke: Story = {
  name: "Med tier-merke",
  args: {
    name: "Podcast til innhald",
    whatItDoes:
      "Gjør en podkast-episode om til blogginnlegg, sosiale poster og kapittelmerker.",
    whenToUse: "du har en episode du vil få mer innhold ut av.",
    icon: "mic",
    href: "#",
    tierLabel: "Pro",
  },
};
