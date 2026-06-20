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
  tags: ["autodocs"],
  parameters: { layout: "padded" },
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
  name: "Parallax — flerlags dybde",
  render: () => (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Scroll i forhåndsvisningen. Flere lag driver i ulik fart (ulik{" "}
        <code>amount</code>) → følelse av dybde. Innholdet står helt stille. Kun
        dekor parallax-er, aldri tekst.
      </p>
      <div className="h-[70vh]" />

      <div className="relative flex h-96 items-center justify-center overflow-hidden rounded-3xl border border-border bg-secondary">
        {/* Bakerst — driver mest, mest blur (lengst unna) */}
        <Parallax amount={90} className="absolute -left-10 -top-10">
          <div className="size-56 rounded-full bg-saffron/40 blur-3xl" />
        </Parallax>
        {/* Midtlag */}
        <Parallax amount={50} className="absolute right-4 top-8">
          <div className="size-40 rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-accent/50 blur-2xl" />
        </Parallax>
        {/* Fremst — driver minst, skarpest (nærmest) */}
        <Parallax amount={24} className="absolute bottom-6 left-10">
          <div className="size-20 rounded-full bg-salmon/70 blur-md" />
        </Parallax>

        <p className="relative z-10 font-bold font-heading text-2xl text-foreground">
          Innhold står stille
        </p>
      </div>

      <p className="mt-6 text-muted-foreground text-sm">
        Tommelfingerregel: jo lenger «bak», jo høyere <code>amount</code> og mer
        blur. Maks ~8–12 % forskyvning av seksjonshøyden (jf. DESIGN-PLAN §3).
      </p>
      <div className="h-[70vh]" />
    </div>
  ),
};
