import {
  CountUp,
  DriftingBlob,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

const meta: Meta = {
  title: "Foundations/Bevegelse",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      {children}
    </div>
  );
}

export const RevealOgStagger: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Reveal>
        <Card>
          <p className="text-sm text-muted-foreground">Reveal</p>
          <p className="text-lg">Fader + glir inn når den kommer i viewport.</p>
        </Card>
      </Reveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {["Steg 1", "Steg 2", "Steg 3"].map((s) => (
          <StaggerItem key={s}>
            <Card>
              <p className="font-semibold text-primary">{s}</p>
              <p className="text-sm text-muted-foreground">
                Barn forskyves inn etter hverandre.
              </p>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  ),
};

export const Tall: Story = {
  render: () => (
    <div className="flex flex-wrap gap-12">
      <div className="flex flex-col">
        <span className="font-heading text-5xl font-bold text-primary">
          <CountUp to={99} suffix="+" />
        </span>
        <span className="text-sm text-muted-foreground">kurs</span>
      </div>
      <div className="flex flex-col">
        <span className="font-heading text-5xl font-bold text-primary">
          <CountUp to={10} suffix="k+" />
        </span>
        <span className="text-sm text-muted-foreground">medlemmer</span>
      </div>
    </div>
  ),
};

export const Blob: Story = {
  render: () => (
    <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-background">
      <DriftingBlob className="-left-10 -top-10 size-72 bg-primary/30" />
      <DriftingBlob
        className="-bottom-16 right-0 size-80 bg-accent/40"
        duration={22}
      />
      <div className="relative z-10 flex h-full items-center justify-center">
        <p className="font-heading text-2xl font-bold text-foreground">
          Den drivende formen
        </p>
      </div>
    </div>
  ),
};

export const ParallaxDekor: Story = {
  render: () => (
    <div className="mx-auto max-w-md">
      <p className="text-sm text-muted-foreground">
        Scroll i forhåndsvisningen — den fargede formen driver forsiktig.
      </p>
      <div className="h-[60vh]" />
      <div className="relative flex h-64 items-center justify-center rounded-2xl border border-border">
        <Parallax amount={50} className="absolute left-6 top-0">
          <div className="size-24 rounded-full bg-accent/50 blur-xl" />
        </Parallax>
        <p className="relative z-10 text-foreground">Innhold står stille</p>
      </div>
      <div className="h-[60vh]" />
    </div>
  ),
};
