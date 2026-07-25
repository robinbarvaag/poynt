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

export interface OrderConfirmationContent {
  /** Overskrift i e-posten. */
  heading?: string;
  /** Innledningstekst under overskriften. */
  intro?: string;
  /** Ekstra melding når ordren har PDF-vedlegg. */
  pdfNote?: string;
  /** Avslutningstekst nederst. */
  footer?: string;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr. */
  total: number;
  /** Admin-redigerbare tekster – faller tilbake på standardtekstene. */
  content?: OrderConfirmationContent;
  /** Om ordren har PDF-vedlegg (styrer visning av pdfNote). */
  hasAttachments?: boolean;
}

const kr = (n: number) => `${new Intl.NumberFormat("nb-NO").format(n)} kr`;

/** Ordrebekreftelse etter gjennomført kjøp. */
export default function OrderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  total,
  content,
  hasAttachments,
}: OrderConfirmationProps) {
  return (
    <EmailShell
      preview={`Ordrebekreftelse #${orderNumber} – takk for handelen!`}
    >
      <Text style={emailStyles.eyebrow}>Ordrebekreftelse #{orderNumber}</Text>
      <Text style={emailStyles.heading}>
        {content?.heading || "Takk for bestillingen!"}
      </Text>
      {customerName ? (
        <Text style={emailStyles.text}>Hei {customerName},</Text>
      ) : null}
      <Text style={emailStyles.text}>
        {content?.intro ||
          "Vi har mottatt bestillingen din. Her er en oppsummering av kjøpet."}
      </Text>

      {hasAttachments && content?.pdfNote ? (
        <Section style={pdfCallout}>
          <Text style={pdfCalloutText}>📎 {content.pdfNote}</Text>
        </Section>
      ) : null}

      <Section style={itemsPanel}>
        {items.map((item, index) => (
          <React.Fragment key={`${item.name}-${item.variant ?? ""}`}>
            {index > 0 ? (
              <Hr style={{ borderColor: brand.border, margin: "12px 0" }} />
            ) : null}
            <Row>
              <Column>
                <Text style={lineName}>{item.name}</Text>
                <Text style={lineMeta}>
                  {item.variant ? `${item.variant} · ` : ""}
                  Antall: {item.quantity}
                </Text>
              </Column>
              <Column
                style={{ textAlign: "right" as const, verticalAlign: "top" }}
              >
                <Text style={linePrice}>{kr(item.price * item.quantity)}</Text>
              </Column>
            </Row>
          </React.Fragment>
        ))}

        <Hr style={totalRule} />

        <Row>
          <Column>
            <Text style={totalLabel}>Totalt</Text>
          </Column>
          <Column style={{ textAlign: "right" as const }}>
            <Text style={totalValue}>{kr(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        {content?.footer ||
          "Har du spørsmål om bestillingen, er det bare å svare på denne e-posten."}
      </Text>
    </EmailShell>
  );
}

const pdfCallout = {
  backgroundColor: brand.panel,
  borderRadius: "14px",
  borderLeft: `3px solid ${brand.saffron}`,
  padding: "14px 18px",
  margin: "0 0 20px",
};

const pdfCalloutText = {
  color: brand.ink,
  fontSize: "15px",
  lineHeight: "23px",
  fontWeight: "600",
  margin: 0,
};

const itemsPanel = {
  backgroundColor: brand.bg,
  borderRadius: "14px",
  border: `1px solid ${brand.border}`,
  padding: "18px 20px",
  margin: "4px 0 0",
};

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

const totalRule = {
  borderColor: brand.saffron,
  borderTopWidth: "2px",
  margin: "14px 0 12px",
};

const totalLabel = {
  color: brand.ink,
  fontSize: "17px",
  fontWeight: "800",
  margin: 0,
};

const totalValue = {
  color: brand.ink,
  fontSize: "20px",
  fontWeight: "800",
  margin: 0,
};
