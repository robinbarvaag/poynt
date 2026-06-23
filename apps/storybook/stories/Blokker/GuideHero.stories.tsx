import { GuideHero } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Blokker/Guide/GuideHero",
  component: GuideHero,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GuideHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UtenCover: Story = {
  args: {
    title: "Instagram",
    eyebrow: "Kanaler",
    lede: "Få mest mulig ut av Instagram — fra reels og karuseller til bio, alt-tekst og delbart innhold.",
    icon: "📸",
    accent: "salmon",
  },
};

export const MedCover: Story = {
  args: {
    title: "AI",
    eyebrow: "Generelt",
    lede: "Verktøyene og arbeidsflytene som sparer deg for timer hver uke.",
    icon: "🤖",
    accent: "mint",
    cover: (
      <img
        src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1600&q=70"
        alt="Dekorativt cover"
      />
    ),
  },
};

export const Aksenter: Story = {
  args: { title: "Aksenter" },
  render: () => (
    <div className="flex flex-col">
      <GuideHero title="Mint" accent="mint" icon="🌿" eyebrow="Accent" />
      <GuideHero title="Saffron" accent="saffron" icon="⭐" eyebrow="Accent" />
      <GuideHero title="Salmon" accent="salmon" icon="🪸" eyebrow="Accent" />
      <GuideHero title="Primary" accent="primary" icon="💚" eyebrow="Accent" />
    </div>
  ),
};
