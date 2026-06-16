import { BlockSection, Button, Heading, Stack, Text } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Design/Sideoppbygging",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fase A av komposisjons-planen (docs/COMPOSITION.md). Hver blokk " +
          "pakkes i `BlockSection`, som styrer bakgrunn + spacing + reveal " +
          "sentralt. En enkel rytme-regel veksler lett mellom lyse flater og " +
          "gir ÉN sterk farge til CTA-en. Blokkene selv er innholds-only.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

type DemoBlock = {
  type: "content" | "cta";
  tittel: string;
  tekst: string;
};

const BLOKKER: DemoBlock[] = [
  {
    type: "content",
    tittel: "Lær i ditt eget tempo",
    tekst: "Kurs og innhold bygget for å ta deg videre, steg for steg.",
  },
  {
    type: "content",
    tittel: "Verktøy som gjør jobben",
    tekst: "AI-drevne verktøy som tar deg fra plan til konkret resultat.",
  },
  {
    type: "content",
    tittel: "Et fellesskap i ryggen",
    tekst: "Del, få tilbakemelding og voks sammen med andre.",
  },
  { type: "cta", tittel: "Klar til å begynne?", tekst: "Bli medlem i dag." },
];

// Rytme-regel: CTA får den ene sterke fargen; ellers lett veksling lyst/dempet.
function background(block: DemoBlock, index: number) {
  if (block.type === "cta") {
    return "primary" as const;
  }
  return index % 2 === 1 ? ("muted" as const) : ("default" as const);
}

export const Side: Story = {
  render: () => (
    <div>
      {BLOKKER.map((block, index) => {
        const onDark = block.type === "cta";
        return (
          <BlockSection
            key={block.tittel}
            background={background(block, index)}
            spacing={block.type === "cta" ? "lg" : "md"}
          >
            <Stack gap="sm" align={onDark ? "center" : "start"}>
              <Heading
                variant="h2"
                color={onDark ? "white" : "foreground"}
                align={onDark ? "center" : "left"}
              >
                {block.tittel}
              </Heading>
              <Text
                variant="lead"
                color={onDark ? "white" : "muted"}
                align={onDark ? "center" : "left"}
                customStyles="max-w-xl"
              >
                {block.tekst}
              </Text>
              {onDark && (
                <Button className="mt-2 rounded-full px-8">Bli medlem</Button>
              )}
            </Stack>
          </BlockSection>
        );
      })}
    </div>
  ),
};
