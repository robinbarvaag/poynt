import { BrandHeader, ColorSwatch, FontSpecimen, SwatchGrid } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const PALETTE = [
  { hex: "#29664f", name: "Skog", role: "Primær" },
  { hex: "#dee5b3", name: "Cream", role: "Nøytral" },
  { hex: "#f3c969", name: "Saffran", role: "Aksent" },
  { hex: "#e8a08d", name: "Salmon", role: "Sekundær" },
  { hex: "#bfe3d0", name: "Mint", role: "Aksent" },
  { hex: "#1a1a1a", name: "Blekk", role: "Nøytral" },
];

const meta = {
  title: "Blokker/Merkevare/Merkevare-bok",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Forside: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl">
      <BrandHeader
        name="Poynt"
        tagline="Markedsføring som faktisk blir gjort"
        surface="cream"
      />
    </div>
  ),
};

export const ForsiderForskjelligeFlater: Story = {
  render: () => (
    <div className="grid gap-6 md:grid-cols-2">
      <BrandHeader name="Poynt" tagline="Mint-flate" surface="mint" />
      <BrandHeader name="Poynt" tagline="Saffran-flate" surface="saffron" />
      <BrandHeader name="Poynt" tagline="Primær-flate" surface="primary" />
      <BrandHeader name="Poynt" tagline="Blekk-flate" surface="ink" />
    </div>
  ),
};

export const Fargepalett: Story = {
  render: () => (
    <div className="max-w-3xl">
      <SwatchGrid colors={PALETTE} />
    </div>
  ),
};

export const EnkeltFargekort: Story = {
  render: () => (
    <div className="flex max-w-xs gap-4">
      <ColorSwatch hex="#29664f" name="Skog" />
      <ColorSwatch hex="#f3c969" name="Saffran" />
    </div>
  ),
};

export const Typografi: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <FontSpecimen fontFamily="Bricolage Grotesque" />
      <FontSpecimen fontFamily="Poppins" />
    </div>
  ),
};

export const HeleBoka: Story = {
  render: () => (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <BrandHeader
        name="Poynt"
        tagline="Markedsføring som faktisk blir gjort"
        surface="cream"
      />
      <SwatchGrid colors={PALETTE} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FontSpecimen fontFamily="Bricolage Grotesque" />
        <FontSpecimen fontFamily="Poppins" />
      </div>
    </div>
  ),
};
