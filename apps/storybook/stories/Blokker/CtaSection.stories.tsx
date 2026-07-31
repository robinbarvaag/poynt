import {
  Button,
  Container,
  GridPattern,
  Heading,
  Panel,
  Section,
} from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * CTA-seksjonen bor i appen (`apps/web/components/blocks/cta-section-block.tsx`)
 * fordi den trenger next/link og kontakt-modalen. Storyen setter sammen de
 * samme @poynt/ui-primitivene, så blokkvelgeren i Payload får et representativt
 * forhåndsvisningsbilde og designet kan vurderes isolert.
 */
const meta: Meta = {
  title: "Blokker/CtaSection",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Avslutningen på en side: én tydelig oppfordring. `colored` er det " +
          "grønne panelet som flyter på sidebakgrunnen, `simple` er samme " +
          "innhold uten fargeflate — bruk den når siden allerede har mange " +
          "paneler.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const innhold = (onDark: boolean) => (
  <div className="mx-auto max-w-2xl text-center">
    <Heading size="h2" color={onDark ? "white" : undefined} customStyles="mb-4">
      Klar for å komme i gang?
    </Heading>
    <p
      className={
        onDark
          ? "mb-8 text-lg text-white/90"
          : "mb-8 text-lg text-muted-foreground"
      }
    >
      Bli med i On Poynt, så tar vi den første kampanjen sammen.
    </p>
    <div className="flex flex-wrap justify-center gap-4">
      <Button size="lg" variant={onDark ? "saffron" : "default"}>
        Bli medlem
      </Button>
      <Button
        size="lg"
        variant="outline"
        className={
          onDark
            ? "border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
            : undefined
        }
      >
        Snakk med oss
      </Button>
    </div>
  </div>
);

export const Farget: Story = {
  name: "Farget panel",
  render: () => (
    <Section spacing="lg">
      <Container padding="none">
        <Panel surface="primary">
          <GridPattern
            variant="dots"
            fade
            className="text-primary-foreground/15"
          />
          <div className="relative z-10">{innhold(true)}</div>
        </Panel>
      </Container>
    </Section>
  ),
};

export const Enkel: Story = {
  name: "Enkel (uten fargeflate)",
  render: () => (
    <Section spacing="lg">
      <Container padding="none">{innhold(false)}</Container>
    </Section>
  ),
};
