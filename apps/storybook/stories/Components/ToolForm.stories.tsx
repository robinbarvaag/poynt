import { OptionCard, PrefilledBadge, StepContainer } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Tool Form",
  component: StepContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Byggeklosser for de stegvise AI-verktøyskjemaene: StepContainer rammer inn et steg med framdrift, OptionCard viser valgbare alternativer og PrefilledBadge markerer felter som er fylt ut automatisk.",
      },
    },
  },
} satisfies Meta<typeof StepContainer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
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
          <OptionCard
            value="handel"
            label="Varehandel"
            description="Butikk og netthandel"
            icon="building"
            isSelected
            onClick={() => {}}
          />
          <OptionCard
            value="teknologi"
            label="Teknologi"
            description="Programvare og IT-tjenester"
            icon="sparkles"
            isSelected={false}
            onClick={() => {}}
          />
        </div>
      </StepContainer>
    </div>
  ),
};
