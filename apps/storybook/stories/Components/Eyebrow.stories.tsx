import { Eyebrow } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof Eyebrow> = {
  title: "Komponenter/Eyebrow",
  component: Eyebrow,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Liten etikett over titler («HVORFOR POYNT», «Steg 01»). Sentralt sted " +
          "for stilen — brukes i alle marketing-blokkene. Tekstfarge via " +
          "`className`, valgfri marker-strek via `marker` (farge med " +
          "`markerClassName`).",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Eyebrow>;

export const Standard: Story = {
  args: { children: "Hvorfor Poynt" },
};

export const Farger: Story = {
  name: "Tekstfarger",
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow className="text-primary">Primary</Eyebrow>
      <Eyebrow>Dempet (default)</Eyebrow>
      <Eyebrow className="text-salmon">Salmon</Eyebrow>
    </div>
  ),
};

export const MedMarker: Story = {
  name: "Med marker-strek",
  render: () => (
    <div className="flex flex-col gap-4">
      <Eyebrow marker markerClassName="bg-primary">
        Steg 01
      </Eyebrow>
      <Eyebrow marker markerClassName="bg-salmon">
        Steg 02
      </Eyebrow>
      <Eyebrow marker markerClassName="bg-foreground">
        Steg 03
      </Eyebrow>
    </div>
  ),
};
