import { Heading, Text } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta: Meta = {
  title: "Foundations/Typografi",
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj;

export const Overskrifter: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <Heading variant="h1">Heading 1 — Bricolage Grotesque</Heading>
      <Heading variant="h2">Heading 2 — Bricolage Grotesque</Heading>
      <Heading variant="h3">Heading 3 — Bricolage Grotesque</Heading>
      <Heading variant="h4">Heading 4 — Poppins</Heading>
    </div>
  ),
};

export const Brodtekst: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <Text variant="lead">
        Lead — en litt større, dempet ingress som introduserer innholdet.
      </Text>
      <Text variant="p" size="body">
        Body — vanlig brødtekst i Poppins. Leken profesjonalitet betyr varme,
        imøtekommende toner uten å miste det seriøse.
      </Text>
      <Text variant="small">
        Small — mindre tekst for metadata og hjelpetekst.
      </Text>
      <Text variant="muted">
        Muted — dempet tekst for sekundær informasjon.
      </Text>
    </div>
  ),
};

export const Skala: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(
        [
          "h1",
          "h2",
          "h3",
          "h3-special",
          "h4",
          "body-heading",
          "body",
          "body-small",
          "body-detail",
        ] as const
      ).map((size) => (
        <div
          key={size}
          className="flex items-baseline gap-4 border-b border-border pb-2"
        >
          <code className="w-32 shrink-0 text-xs text-muted-foreground">
            {size}
          </code>
          <Text type="span" size={size} color="foreground">
            Leken profesjonalitet
          </Text>
        </div>
      ))}
    </div>
  ),
};
