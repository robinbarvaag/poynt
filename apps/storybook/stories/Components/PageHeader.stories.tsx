import { Button, PageHeader } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/PageHeader",
  component: PageHeader,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

// Felles sidetopp for medlemsområdet — tittel + beskrivelse + valgfri handling.
export const Default: Story = {
  args: {
    title: "Bedrifter",
    description:
      "Bytt mellom bedriftene dine, se medlemmer og administrer innstillinger.",
  },
};

export const MedHandling: Story = {
  name: "Med handling",
  args: {
    title: "Kurs",
    description: "Lær i ditt eige tempo med kursa våre.",
    action: <Button>Nytt kurs</Button>,
  },
};

export const MedEyebrow: Story = {
  name: "Med eyebrow",
  args: {
    eyebrow: "Medlemsområde",
    title: "Velkommen til On Poynt!",
    description: "Verktøyene og innholdet ditt – samlet på ett sted.",
  },
};

export const BareTittel: Story = {
  name: "Bare tittel",
  args: { title: "Innstillinger" },
};
