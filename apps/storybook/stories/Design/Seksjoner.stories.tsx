import {
  Container,
  FloatingShapes,
  Heading,
  Section,
  SectionDivider,
  Stack,
  Text,
} from "@poynt/ui";
import { CountUp, Reveal, Stagger, StaggerItem } from "@poynt/ui/motion";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Seksjoner",
  parameters: { layout: "fullscreen" },
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

/** En «reise» nedover siden: fargerytme, formede overganger og scroll-reveal. */
export const Reise: Story = {
  render: () => (
    <div>
      {/* 1 — intro */}
      <Section variant="default" spacing="xl">
        <Container>
          <Reveal>
            <Stack gap="md" align="center">
              <Heading variant="h1" color="foreground" align="center">
                En reise nedover siden
              </Heading>
              <Text
                variant="lead"
                align="center"
                customStyles="max-w-lg text-foreground/70"
              >
                Fargeseksjoner med fast rytme, organiske overganger og subtile
                bevegelser — aldri overkill.
              </Text>
            </Stack>
          </Reveal>
        </Container>
      </Section>

      {/* 2 — slik funker det (muted) */}
      <Section variant="muted" spacing="lg">
        <SectionDivider shape="wave" color="background" />
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

      {/* 3 — tall (primary, mørk, med shades) */}
      <Section
        variant="primary"
        spacing="lg"
        className="relative overflow-hidden"
      >
        <SectionDivider shape="curve" color="muted" />
        <FloatingShapes variant="subtle" />
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

      {/* 4 — CTA (mint) */}
      <Section variant="mint" spacing="lg">
        <SectionDivider shape="slant" color="primary" />
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
