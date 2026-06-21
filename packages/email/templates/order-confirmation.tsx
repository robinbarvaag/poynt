import { Column, Hr, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand, emailStyles } from "./_layout";

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  /** Pris per enhet i kr. */
  price: number;
  /** Valgfri variant-etikett, f.eks. "Størrelse L". */
  variant?: string;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr. */
  total: number;
}

const kr = (n: number) => `${new Intl.NumberFormat("nb-NO").format(n)} kr`;

/** Ordrebekreftelse etter gjennomført kjøp. */
export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  total,
}: OrderConfirmationProps) {
  return (
    <EmailShell
      preview={`Ordrebekreftelse #${orderNumber} – takk for handelen!`}
    >
      <Text style={emailStyles.eyebrow}>Ordrebekreftelse</Text>
      <Text style={emailStyles.heading}>Takk for bestillingen!</Text>
      {customerName ? (
        <Text style={emailStyles.text}>Hei {customerName},</Text>
      ) : null}
      <Text style={emailStyles.text}>
        Vi har mottatt bestillingen din. Her er en oppsummering av kjøpet.
      </Text>

      <Section style={summary}>
        <Text style={emailStyles.label}>Ordrenummer</Text>
        <Text style={{ ...emailStyles.value, margin: "0 0 4px" }}>
          #{orderNumber}
        </Text>
      </Section>

      <Hr style={{ borderColor: brand.border, margin: "8px 0 16px" }} />

      {items.map((item) => (
        <Row
          key={`${item.name}-${item.variant ?? ""}`}
          style={{ marginBottom: "10px" }}
        >
          <Column>
            <Text style={lineName}>
              {item.name}
              {item.variant ? ` – ${item.variant}` : ""}
            </Text>
            <Text style={lineMeta}>Antall: {item.quantity}</Text>
          </Column>
          <Column style={{ textAlign: "right" as const, verticalAlign: "top" }}>
            <Text style={linePrice}>{kr(item.price * item.quantity)}</Text>
          </Column>
        </Row>
      ))}

      <Hr style={{ borderColor: brand.border, margin: "8px 0 12px" }} />

      <Row>
        <Column>
          <Text style={{ ...emailStyles.value, fontWeight: "800", margin: 0 }}>
            Totalt
          </Text>
        </Column>
        <Column style={{ textAlign: "right" as const }}>
          <Text style={{ ...emailStyles.value, fontWeight: "800", margin: 0 }}>
            {kr(total)}
          </Text>
        </Column>
      </Row>

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        Har du spørsmål om bestillingen, er det bare å svare på denne e-posten.
      </Text>
    </EmailShell>
  );
}

const summary = { margin: "0 0 4px" };

const lineName = {
  color: brand.ink,
  fontSize: "16px",
  lineHeight: "22px",
  fontWeight: "600",
  margin: 0,
};

const lineMeta = {
  color: brand.muted,
  fontSize: "13px",
  lineHeight: "18px",
  margin: "2px 0 0",
};

const linePrice = {
  color: brand.ink,
  fontSize: "16px",
  lineHeight: "22px",
  fontWeight: "600",
  margin: 0,
};
