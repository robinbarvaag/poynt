import { Button, Column, Row, Section, Text } from "@react-email/components";
import * as React from "react";
import { EmailShell, brand, emailStyles } from "./_layout";
import { RichContent } from "./rich-content";

export interface SaleNotificationItem {
  name: string;
  quantity?: number;
  /** Pris i kr. Utelates for medlemskap der beløpet ikke er kjent i eventet. */
  price?: number;
}

export interface SaleNotificationProps {
  /** «Produktsalg» eller «Nytt medlemskap». */
  kind: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail: string;
  items: SaleNotificationItem[];
  /** Totalsum i kr. */
  total?: number;
  /** «Stripe» eller «Vipps». */
  paymentProvider?: string;
  /** Lenke til ordren i admin. */
  adminUrl?: string;
  /**
   * Admin-redigert innledning (E-postmaler) — erstatter overskrift og intro.
   * Kunde-, produkt- og sumdetaljene under legges alltid på automatisk.
   */
  introHtml?: string;
}

/** Internt varsel til Poynt når det kommer et salg eller nytt medlemskap. */
export default function SaleNotificationEmail({
  kind,
  orderNumber,
  customerName,
  customerEmail,
  items,
  total,
  paymentProvider,
  adminUrl,
  introHtml,
}: SaleNotificationProps) {
  return (
    <EmailShell preview={`${kind} – ${customerEmail}`}>
      {introHtml ? (
        <RichContent html={introHtml} />
      ) : (
        <>
          <Text style={emailStyles.eyebrow}>{kind}</Text>
          <Text style={emailStyles.heading}>Kaching! 🎉</Text>
          <Text style={emailStyles.text}>
            {orderNumber
              ? `Det er lagt inn en ny bestilling (#${orderNumber}) på poynt.no.`
              : "Det har kommet et nytt salg på poynt.no."}
          </Text>
        </>
      )}

      <Section>
        <Text style={emailStyles.label}>Kunde</Text>
        <Text style={emailStyles.value}>
          {customerName ? `${customerName} · ` : ""}
          {customerEmail}
        </Text>

        {paymentProvider ? (
          <>
            <Text style={emailStyles.label}>Betalt med</Text>
            <Text style={emailStyles.value}>{paymentProvider}</Text>
          </>
        ) : null}
      </Section>

      <Section
        style={{
          backgroundColor: brand.panel,
          borderRadius: "14px",
          padding: "18px 20px",
          margin: "0 0 16px",
        }}
      >
        {items.map((item) => (
          <Row key={item.name}>
            <Column>
              <Text style={{ ...emailStyles.value, margin: "0 0 4px" }}>
                {item.quantity && item.quantity > 1
                  ? `${item.quantity} × `
                  : ""}
                {item.name}
              </Text>
            </Column>
            {typeof item.price === "number" ? (
              <Column align="right">
                <Text style={{ ...emailStyles.value, margin: "0 0 4px" }}>
                  {item.price * (item.quantity ?? 1)} kr
                </Text>
              </Column>
            ) : null}
          </Row>
        ))}
        {typeof total === "number" ? (
          <Row>
            <Column>
              <Text style={{ ...emailStyles.label, margin: "8px 0 0" }}>
                Totalt
              </Text>
            </Column>
            <Column align="right">
              <Text
                style={{
                  ...emailStyles.value,
                  fontWeight: "800",
                  margin: "8px 0 0",
                }}
              >
                {total} kr
              </Text>
            </Column>
          </Row>
        ) : null}
      </Section>

      {adminUrl ? (
        <Section style={{ marginTop: "24px" }}>
          <Button style={emailStyles.button} href={adminUrl}>
            Se bestillingen i admin
          </Button>
        </Section>
      ) : null}
    </EmailShell>
  );
}
