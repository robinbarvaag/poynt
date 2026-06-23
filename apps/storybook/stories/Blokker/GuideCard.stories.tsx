import { GuideCard } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Blokker/Guide/GuideCard",
  component: GuideCard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof GuideCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: "#",
    title: "Instagram",
    lede: "Få mest mulig ut av Instagram — fra reels og karuseller til bio og alt-tekst.",
    icon: "📸",
    category: "Instagram",
    accentColor: "#E1306C",
  },
};

export const UtenIkon: Story = {
  args: {
    href: "#",
    title: "Krisekommunikasjon",
    lede: "Åtte nøkkelpunkter for å håndtere en krise med stø hånd.",
    category: "Kommunikasjon",
    accentColor: "#E67E22",
  },
};

export const Rutenett: Story = {
  args: { href: "#", title: "Instagram" },
  render: () => (
    <div className="grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <GuideCard
        href="#"
        title="LinkedIn"
        lede="Bygg autoritet og nå beslutningstakere."
        icon="💼"
        category="LinkedIn"
        accentColor="#0A66C2"
      />
      <GuideCard
        href="#"
        title="Canva – tips og triks"
        lede="Lag profesjonelt innhold raskere."
        icon="🎨"
        category="Canva"
        accentColor="#00C4CC"
      />
      <GuideCard
        href="#"
        title="AI"
        lede="Verktøyene og arbeidsflytene som sparer deg for timer."
        icon="🤖"
        category="AI"
        accentColor="#6C5CE7"
      />
    </div>
  ),
};
