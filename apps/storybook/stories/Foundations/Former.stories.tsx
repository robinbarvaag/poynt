import {
  BlobShape,
  FloatingShapes,
  SectionDivider,
  WaveDivider,
} from "@poynt/ui";
import { DriftingBlob } from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Former",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Det organiske formspråket: blob-former, flytende fargeflekker og " +
          "formede seksjons-overganger. Sammen med den utvidede paletten " +
          "(salmon/saffron/mint) gir dette den lekne, levende følelsen — alltid " +
          "subtilt og dekorativt (aria-hidden).",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function Swatch({ bg, name }: { bg: string; name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div className={`size-28 rounded-2xl shadow-sm ${bg}`} />
      <code className="text-muted-foreground text-xs">bg-{name}</code>
    </div>
  );
}

export const PlayfulPalett: Story = {
  name: "Utvidet palett",
  render: () => (
    <div className="flex flex-wrap gap-6">
      <Swatch bg="bg-salmon" name="salmon" />
      <Swatch bg="bg-saffron" name="saffron" />
      <Swatch bg="bg-mint" name="mint" />
    </div>
  ),
};

export const Blob: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      {(["salmon", "saffron", "mint", "accent", "primary"] as const).map(
        (c) => (
          <div key={c} className="flex flex-col items-center gap-2">
            <BlobShape color={c} size="sm" />
            <code className="text-muted-foreground text-xs">{c}</code>
          </div>
        )
      )}
    </div>
  ),
};

export const FlytendeFormer: Story = {
  name: "FloatingShapes",
  render: () => (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-background">
      <FloatingShapes variant="vibrant" />
      <div className="relative z-10 flex h-full items-center justify-center">
        <code className="text-muted-foreground text-sm">
          {'<FloatingShapes variant="vibrant" />'}
        </code>
      </div>
    </div>
  ),
};

export const DrivendeBlob: Story = {
  name: "DriftingBlob (motion)",
  render: () => (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-background">
      <DriftingBlob className="-left-10 -top-10 size-72 bg-primary/30" />
      <DriftingBlob
        className="-bottom-16 right-0 size-80 bg-salmon/40"
        duration={22}
      />
      <div className="relative z-10 flex h-full items-center justify-center">
        <code className="text-muted-foreground text-sm">DriftingBlob</code>
      </div>
    </div>
  ),
};

export const Overganger: Story = {
  name: "Seksjons-overganger",
  render: () => (
    <div className="flex flex-col gap-8">
      {(["wave", "curve", "slant", "peak"] as const).map((shape) => (
        <div key={shape} className="overflow-hidden rounded-xl">
          <div className="h-12 bg-background" />
          <SectionDivider shape={shape} color="primary" />
          <div className="h-12 bg-primary" />
          <code className="block bg-card p-2 text-muted-foreground text-xs">
            {`<SectionDivider shape="${shape}" />`}
          </code>
        </div>
      ))}
      <div className="overflow-hidden rounded-xl">
        <div className="h-12 bg-background" />
        <WaveDivider color="accent" />
        <div className="h-12 bg-accent" />
        <code className="block bg-card p-2 text-muted-foreground text-xs">
          {'<WaveDivider color="accent" />'}
        </code>
      </div>
    </div>
  ),
};
