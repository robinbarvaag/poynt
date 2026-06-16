import { Container, Heading, Section, Stack, Text } from "@poynt/ui";
import {
  CountUp,
  DriftingBlob,
  Reveal,
  Stagger,
  StaggerItem,
} from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Seksjoner",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Disiplinert komposisjon (se docs/COMPOSITION.md): mest lyst, lett " +
          "veksling i rytme via spacing, ÉN sterk farget seksjon, og subtil " +
          "scroll-reveal. Ingen stablede dividers — systemet er overalt, " +
          "flørten er sjelden.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const STEG = [
  {
    tittel: "Lær",
    tekst: "Kurs og innhold som tar deg fra nybegynner til trygg.",
  },
  {
    tittel: "Bruk verktøyene",
    tekst: "AI-drevne verktøy som gjør jobben konkret.",
  },
  {
    tittel: "Bli sett",
    tekst: "Del, få tilbakemelding og voks i fellesskapet.",
  },
];

export const Reise: Story = {
  render: () => (
    <div>
      {/* Intro — lyst */}
      <Section spacing="xl">
        <Container>
          <Reveal>
            <Stack gap="md" align="center">
              <Heading variant="h1" color="foreground" align="center">
                En rolig reise nedover siden
              </Heading>
              <Text
                variant="lead"
                align="center"
                customStyles="max-w-xl text-foreground/70"
              >
                Mest lyst, lett veksling i rytmen, subtil bevegelse. Systemet er
                overalt — flørten er sjelden.
              </Text>
            </Stack>
          </Reveal>
        </Container>
      </Section>

      {/* Slik funker det — dempet flate (rytme), ikke ny sterk farge */}
      <Section variant="muted" spacing="lg">
        <Container>
          <Stack gap="lg">
            <Reveal>
              <Heading variant="h2" color="foreground" align="center">
                Slik funker det
              </Heading>
            </Reveal>
            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {STEG.map((s) => (
                <StaggerItem key={s.tittel}>
                  <div className="h-full rounded-2xl bg-card p-6 text-card-foreground shadow-sm">
                    <Heading variant="h4" color="primary">
                      {s.tittel}
                    </Heading>
                    <Text
                      variant="small"
                      customStyles="mt-2 text-muted-foreground"
                    >
                      {s.tekst}
                    </Text>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Stack>
        </Container>
      </Section>

      {/* DEN ENE sterke seksjonen — primary med faint, drivende dekor */}
      <Section
        variant="primary"
        spacing="lg"
        className="relative overflow-hidden"
      >
        <DriftingBlob className="-left-16 -top-10 size-80 bg-mint/15" />
        <DriftingBlob
          className="-bottom-20 -right-10 size-96 bg-saffron/10"
          duration={24}
        />
        <Container>
          <div className="relative z-10 flex flex-wrap justify-center gap-12">
            <div className="flex flex-col items-center">
              <span className="font-heading font-bold text-5xl text-primary-foreground">
                <CountUp to={99} suffix="+" />
              </span>
              <Text color="white">kurs</Text>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-heading font-bold text-5xl text-primary-foreground">
                <CountUp to={10} suffix="k+" />
              </span>
              <Text color="white">medlemmer</Text>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA — tilbake til lyst */}
      <Section spacing="xl">
        <Container>
          <Reveal>
            <Stack gap="md" align="center">
              <Heading variant="h2" color="foreground" align="center">
                Klar til å begynne?
              </Heading>
              <Text align="center" customStyles="text-foreground/70">
                Bli med i dag.
              </Text>
            </Stack>
          </Reveal>
        </Container>
      </Section>
    </div>
  ),
};
