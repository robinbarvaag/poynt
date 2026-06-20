import { LogoCloud, Section } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta<typeof LogoCloud> = {
  title: "Blokker/LogoCloud",
  component: LogoCloud,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof LogoCloud>;

// Ekte merkevarelogoer via simpleicons-CDN. Blanding av brede wordmarks (visa,
// samsung, ibm …) og kvadratiske symboler (github, spotify …) viser at tiles-ene
// normaliserer ulik intrinsisk størrelse til lik høyde.
const brands: { name: string; slug: string }[] = [
  { name: "Visa", slug: "visa" },
  { name: "Samsung", slug: "samsung" },
  { name: "IBM", slug: "ibm" },
  { name: "Spotify", slug: "spotify" },
  { name: "GitHub", slug: "github" },
  { name: "eBay", slug: "ebay" },
  { name: "Airbnb", slug: "airbnb" },
  { name: "Intel", slug: "intel" },
  { name: "Cisco", slug: "cisco" },
  { name: "Slack", slug: "slack" },
];

const colorLogos = brands.map((b) => ({
  name: b.name,
  src: `https://cdn.simpleicons.org/${b.slug}`,
}));

const whiteLogos = brands.map((b) => ({
  name: b.name,
  src: `https://cdn.simpleicons.org/${b.slug}/white`,
}));

const wordmarks = [
  { name: "Kitch'n" },
  { name: "Vår Energi" },
  { name: "Bouvet" },
  { name: "Tilbords" },
  { name: "NOFO" },
  { name: "Sopra Steria" },
];

export const Logoer: Story = {
  name: "Realistiske logoer",
  render: (args) => (
    <Section variant="muted" spacing="md">
      <LogoCloud {...args} />
    </Section>
  ),
  args: {
    label: "Brukt av folk fra",
    logos: colorLogos,
  },
};

export const PaaFargetBand: Story = {
  name: "På farget band (contrast)",
  render: (args) => (
    <Section variant="primary" spacing="md">
      <LogoCloud {...args} />
    </Section>
  ),
  args: {
    label: "Brukt av folk fra",
    variant: "contrast",
    logos: whiteLogos,
  },
};

export const Wordmarks: Story = {
  name: "Wordmarks (uten bilde)",
  render: (args) => (
    <Section variant="muted" spacing="md">
      <LogoCloud {...args} />
    </Section>
  ),
  args: {
    label: "Brukt av folk fra",
    logos: wordmarks,
  },
};
