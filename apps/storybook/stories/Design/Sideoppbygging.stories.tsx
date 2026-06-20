import {
  BlockSection,
  Button,
  ContentMedia,
  FeatureGrid,
  Heading,
  Stack,
  Text,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Sideoppbygging",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fase A av komposisjons-planen (docs/COMPOSITION.md). Hver blokk pakkes " +
          "i `BlockSection`, som styrer bakgrunn + spacing + reveal sentralt. En " +
          "enkel rytme-regel veksler lett mellom lyse/dempa flater og gir ÉN sterk " +
          "farge til CTA-en. Blokkene selv (ContentMedia, FeatureGrid) er " +
          "innholds-only og bryr seg kun om eget innhold.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// Placeholder-foto (picsum, stabilt per seed) — i appen sendes et next/Image inn.
const photo = (seed: string) => (
  <img
    src={`https://picsum.photos/seed/${seed}/900/680`}
    alt=""
    className="h-full w-full object-cover"
  />
);

export const Side: Story = {
  render: () => (
    <div>
      {/* Blokk 1 — redaksjonell tekst + media (lys flate) */}
      <BlockSection
        background="default"
        spacing="lg"
        containerSize={false}
        reveal={false}
      >
        <ContentMedia
          eyebrow="Læring"
          title="Lær i ditt eget tempo"
          body="Kurs og innhold bygget for å ta deg videre, steg for steg — uten stress, når det passer deg."
          bullets={[
            "Strukturerte moduler du kan ta når du vil",
            "Praktiske oppgaver med tilbakemelding",
            "Last ned maler og verktøy underveis",
          ]}
          cta={{ text: "Utforsk kursene", href: "#" }}
          media={photo("poynt-laering")}
          mediaSide="right"
          accent="saffron"
        />
      </BlockSection>

      {/* Blokk 2 — speilet, på dempet flate (rytme-veksling) */}
      <BlockSection
        background="muted"
        spacing="lg"
        containerSize={false}
        reveal={false}
      >
        <ContentMedia
          eyebrow="Verktøy"
          title="Verktøy som gjør jobben"
          body="AI-drevne verktøy som tar deg fra plan til konkret resultat på minutter."
          bullets={[
            "Ferdige oppskrifter for vanlige oppgaver",
            "Tilpasset ditt fagfelt og din stemme",
          ]}
          cta={{ text: "Se verktøyene", href: "#" }}
          media={photo("poynt-verktoy")}
          mediaSide="left"
          accent="salmon"
        />
      </BlockSection>

      {/* Blokk 3 — modige fargeblokker (lys flate) */}
      <BlockSection
        background="default"
        spacing="lg"
        containerSize={false}
        reveal={false}
      >
        <FeatureGrid
          eyebrow="Hvorfor Poynt"
          title="Alt du trenger for å komme videre"
          intro="Læring, verktøy og fellesskap — samlet ett sted."
          columns={3}
          features={[
            {
              title: "Lær i ditt tempo*",
              text: "Strukturerte kurs som tar deg fra nybegynner til trygg.",
              link: { label: "Se kursene", href: "#" },
            },
            {
              title: "AI-verktøy som jobber*",
              text: "La verktøyene gjøre grovjobben, fra idé til ferdig resultat.",
              stat: { value: "12+", label: "verktøy klare" },
            },
            {
              title: "Et fellesskap i ryggen*",
              text: "Del, få tilbakemelding og voks sammen med andre.",
              link: { label: "Bli medlem", href: "#" },
            },
          ]}
        />
      </BlockSection>

      {/* Blokk 4 — DEN ENE sterke fargen: CTA */}
      <BlockSection background="primary" spacing="lg">
        <Stack gap="sm" align="center">
          <Heading variant="h2" color="white" align="center">
            Klar til å begynne?
          </Heading>
          <Text
            variant="lead"
            color="white"
            align="center"
            customStyles="max-w-xl"
          >
            Bli medlem i dag og få tilgang til alt — kurs, verktøy og
            fellesskap.
          </Text>
          <Button className="mt-2 rounded-full px-8">Bli medlem</Button>
        </Stack>
      </BlockSection>
    </div>
  ),
};
