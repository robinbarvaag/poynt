import { OptionCard, PrefilledBadge, StepContainer } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

const meta = {
  title: "Komponenter/Tool Form",
  component: StepContainer,
  parameters: { layout: "centered" },
} satisfies Meta<typeof StepContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

const bransjer = [
  {
    value: "handel",
    label: "Varehandel",
    description: "Butikk og netthandel",
    icon: "building",
  },
  {
    value: "teknologi",
    label: "Teknologi",
    description: "Programvare og IT-tjenester",
    icon: "sparkles",
  },
] as const;

function VelgBransje() {
  const [valgt, setValgt] = useState<string>("handel");
  return (
    <div className="w-[420px]">
      <StepContainer
        currentStep={0}
        totalSteps={3}
        stepIcon="briefcase"
        stepTitle="Velg bransje"
        stepDescription="Vi tilpasser innholdet ut fra bransjen du jobber i."
      >
        <div className="space-y-3">
          <PrefilledBadge fieldName="Bransje" />
          {bransjer.map((b) => (
            <OptionCard
              key={b.value}
              value={b.value}
              label={b.label}
              description={b.description}
              icon={b.icon}
              isSelected={valgt === b.value}
              onClick={() => setValgt(b.value)}
            />
          ))}
        </div>
      </StepContainer>
    </div>
  );
}

export const Default: Story = {
  render: () => <VelgBransje />,
};

// Klikk på et alternativ skal velge det (aria-pressed = true).
export const ValgTest: Story = {
  name: "Test: velg alternativ",
  render: () => <VelgBransje />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const teknologi = canvas.getByRole("button", { name: /Teknologi/i });
    await expect(teknologi).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(teknologi);
    await expect(teknologi).toHaveAttribute("aria-pressed", "true");
  },
};
