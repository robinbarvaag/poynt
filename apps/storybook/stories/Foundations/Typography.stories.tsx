import { Blockquote, Code, Heading, List, Text } from "@poynt/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";

const meta: Meta = {
  title: "Foundations/Typografi",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Heading og Text er design-system-komponentene for all tekst. Bruk " +
          "`variant`, `size`, `color`, `weight` og `align` — IKKE `className` " +
          "(den er bevisst typet som `never`). Trenger du å gå utenfor " +
          "systemet, bruk `customStyles`. Heading bruker Bricolage Grotesque " +
          "(`font-heading`), Text bruker Poppins (`font-sans`).",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-border border-b py-3 last:border-0">
      <code className="text-muted-foreground text-xs">{label}</code>
      {children}
    </div>
  );
}

export const Overskrifter: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Row label='<Heading variant="h1" />'>
        <Heading variant="h1">Heading 1 — Bricolage</Heading>
      </Row>
      <Row label='<Heading variant="h2" />'>
        <Heading variant="h2">Heading 2 — Bricolage</Heading>
      </Row>
      <Row label='<Heading variant="h3" />'>
        <Heading variant="h3">Heading 3 — Bricolage</Heading>
      </Row>
      <Row label='<Heading variant="h4" />'>
        <Heading variant="h4">Heading 4 — Poppins</Heading>
      </Row>
    </div>
  ),
};

export const TekstVarianter: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <Row label='<Text variant="lead" />'>
        <Text variant="lead">
          Lead — en større, dempet ingress som introduserer innholdet.
        </Text>
      </Row>
      <Row label='<Text variant="p" />'>
        <Text variant="p" size="body">
          Body — vanlig brødtekst i Poppins. Leken profesjonalitet betyr varme,
          imøtekommende toner uten å miste det seriøse.
        </Text>
      </Row>
      <Row label='<Text variant="large" />'>
        <Text variant="large">Large — uthevet tekst.</Text>
      </Row>
      <Row label='<Text variant="small" />'>
        <Text variant="small">Small — metadata og hjelpetekst.</Text>
      </Row>
      <Row label='<Text variant="muted" />'>
        <Text variant="muted">Muted — sekundær informasjon.</Text>
      </Row>
    </div>
  ),
};

export const Storrelsesskala: Story = {
  name: "Størrelsesskala (size)",
  render: () => (
    <div className="flex flex-col gap-2">
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
        <Row key={size} label={`size="${size}"`}>
          <Text type="span" size={size} color="foreground">
            Leken profesjonalitet
          </Text>
        </Row>
      ))}
    </div>
  ),
};

export const Farger: Story = {
  name: "Farger (color)",
  render: () => (
    <div className="flex flex-col gap-2">
      {(["primary", "foreground", "muted", "danger", "success"] as const).map(
        (color) => (
          <Row key={color} label={`color="${color}"`}>
            <Text size="body-heading" color={color}>
              Leken profesjonalitet
            </Text>
          </Row>
        )
      )}
    </div>
  ),
};

export const Vekter: Story = {
  name: "Vekter (weight)",
  render: () => (
    <div className="flex flex-col gap-2">
      {(
        ["light", "normal", "medium", "semibold", "bold", "extrabold"] as const
      ).map((weight) => (
        <Row key={weight} label={`weight="${weight}"`}>
          <Text size="body-heading" color="foreground" weight={weight}>
            Leken profesjonalitet
          </Text>
        </Row>
      ))}
    </div>
  ),
};

export const Justering: Story = {
  name: "Justering (align)",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      {(["left", "center", "right"] as const).map((align) => (
        <Row key={align} label={`align="${align}"`}>
          <Text size="body" color="foreground" align={align}>
            Denne teksten er justert {align}.
          </Text>
        </Row>
      ))}
    </div>
  ),
};

export const OvrigeElementer: Story = {
  name: "Øvrige elementer",
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6">
      <Blockquote>
        «Leken profesjonalitet» — varmt og imøtekommende, men fortsatt seriøst.
      </Blockquote>
      <Text variant="p">
        Inline <Code>kode</Code> vises slik midt i en setning.
      </Text>
      <List>
        <li>Punkt én</li>
        <li>Punkt to</li>
        <li>Punkt tre</li>
      </List>
    </div>
  ),
};

export const Bruk: Story = {
  name: "Bruk — komposisjon",
  parameters: {
    docs: {
      description: {
        story:
          "Et realistisk eksempel. Merk: `customStyles` (ikke `className`) " +
          "brukes når man trenger å justere utenfor variant-propsene.",
      },
    },
  },
  render: () => (
    <div className="flex max-w-xl flex-col gap-4">
      <Text variant="small" color="primary" weight="semibold">
        FELLESSKAP
      </Text>
      <Heading variant="h2" color="foreground" customStyles="max-w-md">
        Lær av folk som har gått veien før deg
      </Heading>
      <Text variant="lead" customStyles="text-foreground/70">
        Bli en del av et fellesskap der du får tilbakemelding, inspirasjon og
        konkrete verktøy.
      </Text>
    </div>
  ),
};
