import {
  Button,
  Container,
  FeatureGrid,
  Heading,
  Section,
  Sprinkles,
  Stack,
  StatsBand,
  Steps,
  Text,
} from "@poynt/ui";
import { Reveal } from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Seksjoner",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Reisen nedover siden, satt sammen av de faktiske blokk-komponentene " +
          "(FeatureGrid, Steps, StatsBand) i riktig rytme — ikke flate, " +
          "håndrullede bokser. Mest lyst, lett veksling via spacing/dempet flate, " +
          "og ÉN sterk farget seksjon (tall-båndet). Se docs/COMPOSITION.md.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Reise: Story = {
  render: () => (
    <div>
      {/* 1 — Verdi: modige fargeblokker (lys flate rundt) */}
      <Section spacing="xl">
        <FeatureGrid
          eyebrow="Hvorfor Poynt"
          title="Alt du trenger for å komme videre"
          intro="Læring, verktøy og fellesskap — samlet ett sted."
          columns={3}
          features={[
            {
              title: "Lær i ditt tempo*",
              text: "Strukturerte kurs som tar deg fra nybegynner til trygg — når det passer deg.",
              link: { label: "Se kursene", href: "#" },
            },
            {
              title: "AI-verktøy som jobber*",
              text: "La verktøyene gjøre grovjobben, fra idé til ferdig resultat på minutter.",
              stat: { value: "12+", label: "verktøy klare" },
            },
            {
              title: "Et fellesskap i ryggen*",
              text: "Del, få tilbakemelding og voks sammen med andre på samme reise.",
              link: { label: "Bli medlem", href: "#" },
            },
          ]}
        />
      </Section>

      {/* 2 — Slik funker det: dempet flate (rytme), redaksjonell zig-zag */}
      <Section variant="muted" spacing="lg">
        <Steps
          eyebrow="Kom i gang"
          title="Slik funker det"
          intro="Tre steg fra nysgjerrig til i gang."
          steps={[
            {
              title: "Lær",
              text: "Velg et kurs og lær i ditt eget tempo, med innhold som tar deg steg for steg.",
            },
            {
              title: "Bruk verktøyene",
              text: "Sett kunnskapen i arbeid med AI-verktøy som gjør jobben konkret.",
            },
            {
              title: "Bli sett",
              text: "Del resultatene, få tilbakemelding og voks sammen med fellesskapet.",
            },
          ]}
        />
      </Section>

      {/* 3 — DEN ENE sterke fargen: tall-/bevis-bånd */}
      <StatsBand
        eyebrow="I tall"
        title="Et fellesskap i vekst"
        variant="primary"
        stats={[
          { value: 99, suffix: "+", label: "kurs" },
          { value: 10, suffix: "k+", label: "medlemmer" },
          { value: 12, suffix: "+", label: "AI-verktøy" },
          { value: 4, suffix: ".9", label: "snittvurdering" },
        ]}
      />

      {/* 4 — CTA: tilbake til lyst, med litt krydder bak */}
      <Section spacing="xl" className="relative overflow-hidden">
        <Sprinkles />
        <Container className="relative z-10">
          <Reveal>
            <Stack gap="md" align="center">
              <Heading variant="h2" color="foreground" align="center">
                Klar til å begynne?
              </Heading>
              <Text align="center" customStyles="max-w-md text-foreground/70">
                Bli medlem i dag og få tilgang til alt — kurs, verktøy og
                fellesskap.
              </Text>
              <Button size="lg" className="mt-2 rounded-full px-8">
                Bli medlem
              </Button>
            </Stack>
          </Reveal>
        </Container>
      </Section>
    </div>
  ),
};
