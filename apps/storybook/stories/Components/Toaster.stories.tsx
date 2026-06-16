import { Button, Toaster, toast } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Komponenter/Toaster",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Midlertidige varslingsmeldinger som dukker opp i hjørnet. Brukes for tilbakemeldinger som bekreftelser, feil og statusoppdateringer uten å avbryte brukeren.",
      },
    },
  },
} satisfies Meta<typeof Toaster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Button onClick={() => toast("Lagret!")}>Vis toast</Button>
      <Toaster />
    </>
  ),
};
