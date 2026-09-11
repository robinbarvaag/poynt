import {
  Column,
  Hr,
  Img,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { EmailShell, brand, emailStyles } from "./_layout";

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  /** Pris per enhet i kr, inkludert MVA. */
  price: number;
  /** Valgfri variant-etikett, f.eks. "Størrelse L". */
  variant?: string;
  /** MVA-sats i prosent (25 eller 0). Utelatt → linjen vises uten sats. */
  vatRate?: number;
  /** Absolutt URL til produktbilde (e-postklienter krever absolutt). */
  imageUrl?: string;
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

/** Selgeropplysninger — påkrevd innhold i et salgsdokument. */
export interface OrderConfirmationSeller {
  name: string;
  orgNumber?: string;
  vatRegistered?: boolean;
  /** Adresse, linjeskift-separert. */
  address?: string;
  supportEmail?: string;
  supportPhone?: string;
}

/** Juridiske tekster og lenker. */
export interface OrderConfirmationLegal {
  /** Angrerett-forbehold for digitalt innhold. */
  withdrawalNotice?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  /** Kjøpsdato — formateres som «11. september 2026». */
  orderDate?: Date | string;
  customerName?: string;
  customerEmail?: string;
  /** «Vipps» eller «Kort (Stripe)». */
  paymentMethod?: string;
  items: OrderConfirmationItem[];
  /** Totalsum i kr, inkludert MVA, etter rabatt. */
  total: number;
  /** Rabatt i kr (positivt tall) — vises som egen linje når satt. */
  discount?: number;
  /** Admin-redigerbare tekster – faller tilbake på standardtekstene. */
  content?: OrderConfirmationContent;
  seller?: OrderConfirmationSeller;
  legal?: OrderConfirmationLegal;
  /** Om ordren har PDF-vedlegg (styrer visning av pdfNote). */
  hasAttachments?: boolean;
}

const kr = (n: number) =>
  `${new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n)} kr`;

const formatDate = (value?: Date | string) => {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Oslo",
  }).format(date);
};

/** MVA-andel av et bruttobeløp (prisene er inkl. MVA). */
const vatOf = (gross: number, rate: number) =>
  rate > 0 ? (gross * rate) / (100 + rate) : 0;

/**
 * MVA-oppsummering per sats. Rabatt trekkes fra totalen, så MVA skaleres med
 * forholdet betalt/linjesum — samme regel som lib/vat.ts i appen.
 */
function vatSummary(items: OrderConfirmationItem[], total: number) {
  const linesGross = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const factor = linesGross > 0 ? Math.min(1, total / linesGross) : 0;
  const byRate = new Map<number, number>();
  for (const item of items) {
    const rate = item.vatRate ?? 25;
    const vat = vatOf(item.price * item.quantity, rate) * factor;
    byRate.set(rate, (byRate.get(rate) ?? 0) + vat);
  }
  const rows = [...byRate.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([rate, amount]) => ({
      rate,
      amount: Math.round(amount * 100) / 100,
    }));
  const vatTotal =
    Math.round(rows.reduce((s, r) => s + r.amount, 0) * 100) / 100;
  return { rows, vatTotal, net: Math.round((total - vatTotal) * 100) / 100 };
}

/** Ordrebekreftelse etter gjennomført kjøp — utformet som salgsdokument. */
export default function OrderConfirmationEmail({
  orderNumber,
  orderDate,
  customerName,
  customerEmail,
  paymentMethod,
  items,
  total,
  discount,
  content,
  seller,
  legal,
  hasAttachments,
}: OrderConfirmationProps) {
  const vatRegistered = seller?.vatRegistered ?? true;
  const vat = vatRegistered ? vatSummary(items, total) : null;
  const orgLabel = seller?.orgNumber
    ? `Org.nr. ${seller.orgNumber}${vatRegistered ? " MVA" : ""}`
    : null;

  return (
    <EmailShell
      preview={`Ordrebekreftelse #${orderNumber} – takk for handelen!`}
      footerLinks={[
        ...(legal?.termsUrl
          ? [{ label: "Kjøpsbetingelser", href: legal.termsUrl }]
          : []),
        ...(legal?.privacyUrl
          ? [{ label: "Personvern", href: legal.privacyUrl }]
          : []),
      ]}
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

      {/* Ordrefakta: nummer, dato, betalingsmåte, kunde */}
      <Section style={factsPanel}>
        <Row>
          <Column style={factCol}>
            <Text style={emailStyles.label}>Ordrenummer</Text>
            <Text style={factValue}>#{orderNumber}</Text>
          </Column>
          <Column style={factCol}>
            <Text style={emailStyles.label}>Dato</Text>
            <Text style={factValue}>{formatDate(orderDate)}</Text>
          </Column>
        </Row>
        {paymentMethod || customerEmail ? (
          <Row>
            {paymentMethod ? (
              <Column style={factCol}>
                <Text style={emailStyles.label}>Betalt med</Text>
                <Text style={factValue}>{paymentMethod}</Text>
              </Column>
            ) : null}
            {customerEmail ? (
              <Column style={factCol}>
                <Text style={emailStyles.label}>Kunde</Text>
                <Text style={factValue}>
                  {customerName ? `${customerName} · ` : ""}
                  {customerEmail}
                </Text>
              </Column>
            ) : null}
          </Row>
        ) : null}
      </Section>

      {/* Varelinjer */}
      <Section style={itemsPanel}>
        {items.map((item, index) => (
          <React.Fragment key={`${item.name}-${item.variant ?? ""}`}>
            {index > 0 ? (
              <Hr style={{ borderColor: brand.border, margin: "12px 0" }} />
            ) : null}
            <Row>
              {item.imageUrl ? (
                <Column style={imageCol}>
                  <Img
                    src={item.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    style={thumb}
                  />
                </Column>
              ) : null}
              <Column>
                <Text style={lineName}>{item.name}</Text>
                <Text style={lineMeta}>
                  {item.variant ? `${item.variant} · ` : ""}
                  {item.quantity} × {kr(item.price)}
                  {vatRegistered && item.vatRate != null
                    ? ` · ${item.vatRate} % MVA`
                    : ""}
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

        {discount && discount > 0 ? (
          <Row>
            <Column>
              <Text style={summaryLabel}>Rabatt</Text>
            </Column>
            <Column style={{ textAlign: "right" as const }}>
              <Text style={summaryValue}>−{kr(discount)}</Text>
            </Column>
          </Row>
        ) : null}

        {vat ? (
          <>
            <Row>
              <Column>
                <Text style={summaryLabel}>Beløp uten MVA</Text>
              </Column>
              <Column style={{ textAlign: "right" as const }}>
                <Text style={summaryValue}>{kr(vat.net)}</Text>
              </Column>
            </Row>
            {vat.rows.map((row) => (
              <Row key={row.rate}>
                <Column>
                  <Text style={summaryLabel}>MVA {row.rate} %</Text>
                </Column>
                <Column style={{ textAlign: "right" as const }}>
                  <Text style={summaryValue}>{kr(row.amount)}</Text>
                </Column>
              </Row>
            ))}
          </>
        ) : null}

        <Row>
          <Column>
            <Text style={totalLabel}>
              Totalt{vatRegistered ? " (inkl. MVA)" : ""}
            </Text>
          </Column>
          <Column style={{ textAlign: "right" as const }}>
            <Text style={totalValue}>{kr(total)}</Text>
          </Column>
        </Row>
        {vat ? (
          <Text style={vatNote}>Herav MVA: {kr(vat.vatTotal)}</Text>
        ) : (
          <Text style={vatNote}>
            Selger er ikke registrert i Merverdiavgiftsregisteret. Beløpet er
            uten MVA.
          </Text>
        )}
      </Section>

      {legal?.withdrawalNotice ? (
        <Section style={noticePanel}>
          <Text style={noticeTitle}>Angrerett</Text>
          <Text style={noticeText}>{legal.withdrawalNotice}</Text>
        </Section>
      ) : null}

      <Text style={{ ...emailStyles.text, marginTop: "24px" }}>
        {content?.footer ||
          "Har du spørsmål om bestillingen, er det bare å svare på denne e-posten."}
      </Text>

      {seller ? (
        <Section style={sellerPanel}>
          <Text style={emailStyles.label}>Selger</Text>
          <Text style={sellerText}>
            <strong>{seller.name}</strong>
            {orgLabel ? (
              <>
                <br />
                {orgLabel}
              </>
            ) : null}
            {seller.address
              ? seller.address.split(/\r?\n/).map((line) => (
                  <React.Fragment key={line}>
                    <br />
                    {line}
                  </React.Fragment>
                ))
              : null}
            {seller.supportEmail ? (
              <>
                <br />
                <Link href={`mailto:${seller.supportEmail}`} style={sellerLink}>
                  {seller.supportEmail}
                </Link>
              </>
            ) : null}
            {seller.supportPhone ? (
              <>
                <br />
                {seller.supportPhone}
              </>
            ) : null}
          </Text>
        </Section>
      ) : null}
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

const factsPanel = {
  margin: "0 0 16px",
};

const factCol = {
  verticalAlign: "top" as const,
  paddingRight: "12px",
};

const factValue = {
  color: brand.ink,
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 12px",
};

const itemsPanel = {
  backgroundColor: brand.bg,
  borderRadius: "14px",
  border: `1px solid ${brand.border}`,
  padding: "18px 20px",
  margin: "4px 0 0",
};

const imageCol = {
  width: "68px",
  verticalAlign: "top" as const,
};

const thumb = {
  borderRadius: "10px",
  border: `1px solid ${brand.border}`,
  objectFit: "cover" as const,
  display: "block",
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

const summaryLabel = {
  color: brand.muted,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 4px",
};

const summaryValue = {
  color: brand.ink,
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 4px",
};

const totalLabel = {
  color: brand.ink,
  fontSize: "17px",
  fontWeight: "800",
  margin: "6px 0 0",
};

const totalValue = {
  color: brand.ink,
  fontSize: "20px",
  fontWeight: "800",
  margin: "6px 0 0",
};

const vatNote = {
  color: brand.muted,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0 0",
};

const noticePanel = {
  backgroundColor: brand.panel,
  borderRadius: "14px",
  borderLeft: `3px solid ${brand.primary}`,
  padding: "14px 18px",
  margin: "20px 0 0",
};

const noticeTitle = {
  color: brand.ink,
  fontSize: "13px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const noticeText = {
  color: brand.body,
  fontSize: "14px",
  lineHeight: "21px",
  margin: 0,
};

const sellerPanel = {
  borderTop: `1px solid ${brand.border}`,
  paddingTop: "18px",
  margin: "8px 0 0",
};

const sellerText = {
  color: brand.body,
  fontSize: "13px",
  lineHeight: "20px",
  margin: 0,
};

const sellerLink = {
  color: brand.primary,
  textDecoration: "underline",
};
