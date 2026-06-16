import { ActionButton } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof ActionButton> = {
  title: "Components/ActionButton",
  component: ActionButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Leken CTA-knapp i Poynt-språket. En forskjøvet aksent-flate ligger bak " +
          "som en hard skygge; ved hover sklir den inn og dekker hele knappen mens " +
          "tekstfargen bytter — samme grep som fargeblokken bak ContentMedia. " +
          "HOLD MUSA OVER for å se sveipet.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ActionButton>;

export const Standard: Story = {
  args: { children: "Bli medlem", accent: "primary", size: "lg" },
};

export const AlleAksenter: Story = {
  name: "Alle aksenter",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <ActionButton accent="primary">Bli medlem</ActionButton>
      <ActionButton accent="saffron">Se kursene</ActionButton>
      <ActionButton accent="salmon">Prøv gratis</ActionButton>
      <ActionButton accent="ink">Logg inn</ActionButton>
    </div>
  ),
};

export const Storrelser: Story = {
  name: "Størrelser",
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <ActionButton accent="primary" size="default">
        Standard
      </ActionButton>
      <ActionButton accent="primary" size="lg">
        Stor
      </ActionButton>
    </div>
  ),
};

export const SomLenke: Story = {
  name: "Som lenke",
  args: { children: "Til kursene", href: "#", accent: "saffron", size: "lg" },
};
