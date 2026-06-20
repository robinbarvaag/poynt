import { Container, Grid, Heading, Section, Text } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Layout",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "`Section` gir en full-bredde seksjon med valgfri bakgrunnsfarge " +
          "(default/muted/primary/accent). `Container` sentrerer innholdet med " +
          "fast maks-bredde (sm/default/lg/full) og vertikal padding. Mønsteret " +
          "for fargede full-bredde-seksjoner: `Section` ytterst (farge edge-to-" +
          "edge), `Container` inni (innhold med maks-bredde).",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function Box({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border border-dashed bg-card/50 p-4 text-center">
      <code className="text-muted-foreground text-xs">{label}</code>
    </div>
  );
}

export const ContainerStorrelser: Story = {
  name: "Container — størrelser",
  render: () => (
    <div className="flex flex-col gap-4 py-8">
      {(["sm", "default", "lg", "full"] as const).map((size) => (
        <Container key={size} size={size} padding="none">
          <Box label={`<Container size="${size}" />`} />
        </Container>
      ))}
    </div>
  ),
};

export const SeksjonsVarianter: Story = {
  name: "Section — fargevarianter",
  render: () => (
    <div className="flex flex-col">
      {(["default", "muted", "primary", "accent"] as const).map((variant) => (
        <Section key={variant} variant={variant}>
          <Container padding="lg">
            <code className="text-xs opacity-70">
              {`<Section variant="${variant}" />`}
            </code>
          </Container>
        </Section>
      ))}
    </div>
  ),
};

export const Rutenett: Story = {
  name: "Grid — responsivt rutenett",
  parameters: {
    docs: {
      description: {
        story:
          "`Grid` er komposisjons-primitivet for rutenett (cols 1–4, gap xs–xl) " +
          "med fornuftig nedtrapping på mindre skjermer. FeatureGrid bygger på " +
          "samme `gridVariants`.",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-8 py-8">
      {([2, 3, 4] as const).map((cols) => (
        <Grid key={cols} cols={cols}>
          {["a", "b", "c", "d"].slice(0, cols).map((id) => (
            <Box key={`${cols}-${id}`} label={`<Grid cols={${cols}}>`} />
          ))}
        </Grid>
      ))}
    </div>
  ),
};

export const Monster: Story = {
  name: "Mønster — farget seksjon med innhold",
  parameters: {
    docs: {
      description: {
        story:
          "Den typiske komposisjonen: full-bredde farge fra Section, innhold " +
          "med maks-bredde fra Container.",
      },
    },
  },
  render: () => (
    <Section variant="muted">
      <Container size="default" padding="xl">
        <div className="flex flex-col gap-3">
          <Heading variant="h2" color="foreground">
            En seksjon med innhold
          </Heading>
          <Text variant="lead" customStyles="max-w-md text-foreground/70">
            Bakgrunnen strekker seg edge-to-edge, mens teksten holder seg innen
            en behagelig lesebredde.
          </Text>
        </div>
      </Container>
    </Section>
  ),
};
