import { JourneyPath, type JourneyStage } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/JourneyPath",
  component: JourneyPath,
  parameters: { layout: "padded" },
} satisfies Meta<typeof JourneyPath>;

export default meta;

type Story = StoryObj<typeof meta>;

// Guidet vei gjennom et oppsett — fire faser som et fargespektrum, der bare den
// aktive fasen får en tydelig handling.
const stages: JourneyStage[] = [
  {
    step: 1,
    surface: "mint",
    icon: "building-2",
    status: "done",
    title: "Bli kjent",
    payoff: "Fortell oss om bedriften, så blir alt vi lager skreddersydd.",
    href: "#",
    meta: "Profilen er fylt ut",
  },
  {
    step: 2,
    surface: "saffron",
    icon: "compass",
    status: "active",
    title: "Finn retningen",
    payoff: "Finn kanalene du bør satse på — og en strategi å følge.",
    href: "#",
    cta: "Lag markedsplan",
  },
  {
    step: 3,
    surface: "salmon",
    icon: "calendar-days",
    status: "upcoming",
    title: "Planlegg året",
    payoff: "Sett innholdet i system: 12 måneder tilpasset sesongene dine.",
    href: "#",
    meta: "Etter at du har en plan",
  },
  {
    step: 4,
    surface: "primary",
    icon: "send",
    status: "upcoming",
    title: "Lag & del innhold",
    payoff: "Lag innlegg klare for hver kanal, i bedriftens stemme.",
    href: "#",
    meta: "Etter at året er planlagt",
  },
];

export const Default: Story = {
  args: { eyebrow: "Veien videre", title: "Slik kommer du i gang", stages },
};

export const AltFullført: Story = {
  name: "Alt fullført",
  args: {
    title: "Slik kommer du i gang",
    stages: stages.map((s) => ({
      ...s,
      status: "done" as const,
      meta: "Ferdig",
    })),
  },
};
