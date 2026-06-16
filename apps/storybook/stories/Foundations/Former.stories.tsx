import { FloatingShapes, Grain, Heading, Text } from "@poynt/ui";
import { DriftingBlob } from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Tekstur og former",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Signaturen vår er redaksjonell: en fin korn-/papirtekstur over alt, " +
          "litt asymmetriske layouts, og myke drivende fargeflekker som bakgrunn. " +
          "Ingen seksjons-dividers — teksturen og asymmetrien gir det unike, " +
          "uten et grep som er lett å kjenne igjen fra andre prosjekter. Alt er " +
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

export const Korn: Story = {
  name: "Grain (signatur)",
  render: () => (
    <div className="flex flex-col gap-6">
      <Text variant="muted">
        Print-/papirkorn lagt over med <code>multiply</code>. Gir en taktil,
        redaksjonell følelse. Brukes globalt én gang i layouten (&lt;Grain fixed
        /&gt;), eller lokalt på en flate.
      </Text>
      <Text variant="muted" customStyles="text-xs">
        Vist på lys flate — kornet kommer fra <code>multiply</code> og er derfor
        nesten usynlig på mørke farger. Sammenlign rutene: «ingen» mot de tre
        styrkene.
      </Text>
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-40 w-56 overflow-hidden rounded-2xl border border-border bg-card" />
          <code className="text-muted-foreground text-xs">ingen</code>
        </div>
        {(["subtle", "medium", "strong"] as const).map((intensity) => (
          <div key={intensity} className="flex flex-col gap-2">
            <div className="relative h-40 w-56 overflow-hidden rounded-2xl border border-border bg-card">
              <Grain intensity={intensity} />
            </div>
            <code className="text-muted-foreground text-xs">{intensity}</code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AsymmetriskLayout: Story = {
  name: "Asymmetrisk layout",
  render: () => (
    <div className="rounded-2xl border border-border bg-background p-6 md:p-10">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Smal venstre-rail som «hanger» — magasinfølelse */}
        <div className="md:col-span-4 md:pt-2">
          <Text variant="muted" customStyles="uppercase tracking-wide text-xs">
            Redaksjonelt
          </Text>
          <Heading variant="h3" customStyles="mt-2">
            Innhold som bryter griddet
          </Heading>
        </div>
        {/* Bred høyre-kolonne, forskjøvet fra midten */}
        <div className="md:col-span-7 md:col-start-6">
          <Text customStyles="text-muted-foreground">
            I stedet for alltid å midtstille, lar vi tekst og bilder sitte litt
            av-senter, med ujevne kolonneforhold (4 / 7) og luft på én side. Det
            gir en rolig, redaksjonell rytme — distinkt uten dekorative former.
          </Text>
        </div>
      </div>
    </div>
  ),
};

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
