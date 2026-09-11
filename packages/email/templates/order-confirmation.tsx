import { Img, Link, Section, Text } from "@react-email/components";
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
  /** Vises ikke i e-posten (mottakeren er kunden) — beholdt for kompatibilitet. */
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

  const facts: { label: string; value: string }[] = [
    { label: "Ordrenummer", value: `#${orderNumber}` },
    { label: "Dato", value: formatDate(orderDate) },
    ...(paymentMethod ? [{ label: "Betalt med", value: paymentMethod }] : []),
  ];

  const summaryRows: { label: string; value: string }[] = [
    ...(discount && discount > 0
      ? [{ label: "Rabatt", value: `−${kr(discount)}` }]
      : []),
    ...(vat
      ? [
          { label: "Beløp uten MVA", value: kr(vat.net) },
          ...vat.rows.map((row) => ({
            label: `MVA ${row.rate} %`,
            value: kr(row.amount),
          })),
        ]
      : []),
  ];

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
        <Text style={pdfNoteText}>{content.pdfNote}</Text>
      ) : null}

      {/* Ordrefakta: nummer, dato, betalingsmåte */}
      <Section style={factsPanel}>
        <table
          style={table}
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
        >
          <tbody>
            {facts.map((fact, index) => (
              <tr key={fact.label}>
                <td style={index === 0 ? factLabelCellFirst : factLabelCell}>
                  {fact.label}
                </td>
                <td style={index === 0 ? factValueCellFirst : factValueCell}>
                  {fact.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Varelinjer */}
      <Section style={itemsPanel}>
        <table
          style={table}
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
        >
          <thead>
            <tr>
              <th style={thLeft}>Produkt</th>
              <th style={thCenter}>Antall</th>
              <th style={thRight}>Beløp</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.name}-${item.variant ?? ""}`}>
                <td style={lineCell}>
                  {item.imageUrl ? (
                    <Img
                      src={item.imageUrl}
                      alt=""
                      width={44}
                      height={44}
                      style={thumb}
                    />
                  ) : null}
                  <span style={lineName}>{item.name}</span>
                  <br />
                  <span style={lineMeta}>
                    {item.variant ? `${item.variant} · ` : ""}
                    {kr(item.price)} per stk
                    {vatRegistered && item.vatRate != null
                      ? ` · ${item.vatRate} % MVA`
                      : ""}
                  </span>
                </td>
                <td style={lineCellCenter}>{item.quantity}</td>
                <td style={lineCellRight}>{kr(item.price * item.quantity)}</td>
              </tr>
            ))}
            {summaryRows.map((row) => (
              <tr key={row.label}>
                <td colSpan={2} style={summaryLabelCell}>
                  {row.label}
                </td>
                <td style={summaryValueCell}>{row.value}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={totalLabelCell}>
                Totalt{vatRegistered ? " (inkl. MVA)" : ""}
              </td>
              <td style={totalValueCell}>{kr(total)}</td>
            </tr>
          </tbody>
        </table>
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

const pdfNoteText = {
  color: brand.body,
  fontSize: "14px",
  lineHeight: "21px",
  margin: "-4px 0 20px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const factsPanel = {
  margin: "0 0 16px",
};

const factLabelCell = {
  color: brand.muted,
  fontSize: "14px",
  lineHeight: "20px",
  padding: "9px 0",
  borderTop: `1px solid ${brand.border}`,
  verticalAlign: "top" as const,
  whiteSpace: "nowrap" as const,
};

const factLabelCellFirst = { ...factLabelCell, borderTop: "none" };

const factValueCell = {
  color: brand.ink,
  fontSize: "14px",
  lineHeight: "20px",
  fontWeight: "600",
  padding: "9px 0",
  borderTop: `1px solid ${brand.border}`,
  textAlign: "right" as const,
  verticalAlign: "top" as const,
};

const factValueCellFirst = { ...factValueCell, borderTop: "none" };

const itemsPanel = {
  backgroundColor: brand.bg,
  borderRadius: "14px",
  border: `1px solid ${brand.border}`,
  padding: "6px 18px 14px",
  margin: "4px 0 0",
};

const th = {
  color: brand.muted,
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  padding: "10px 0 8px",
  borderBottom: `1px solid ${brand.border}`,
  verticalAlign: "bottom" as const,
};

const thLeft = { ...th, textAlign: "left" as const };
const thCenter = {
  ...th,
  textAlign: "center" as const,
  padding: "10px 12px 8px",
};
const thRight = { ...th, textAlign: "right" as const };

const thumb = {
  borderRadius: "8px",
  border: `1px solid ${brand.border}`,
  objectFit: "cover" as const,
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: "12px",
};

const lineCell = {
  padding: "12px 0",
  borderBottom: `1px solid ${brand.border}`,
  verticalAlign: "top" as const,
};

const lineCellCenter = {
  ...lineCell,
  color: brand.ink,
  fontSize: "15px",
  lineHeight: "22px",
  textAlign: "center" as const,
  padding: "12px 12px",
};

const lineCellRight = {
  ...lineCell,
  color: brand.ink,
  fontSize: "15px",
  lineHeight: "22px",
  fontWeight: "600",
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
};

const lineName = {
  color: brand.ink,
  fontSize: "15px",
  lineHeight: "22px",
  fontWeight: "600",
};

const lineMeta = {
  color: brand.muted,
  fontSize: "13px",
  lineHeight: "18px",
};

const summaryLabelCell = {
  color: brand.muted,
  fontSize: "14px",
  lineHeight: "20px",
  padding: "6px 0 0",
  textAlign: "right" as const,
};

const summaryValueCell = {
  color: brand.ink,
  fontSize: "14px",
  lineHeight: "20px",
  padding: "6px 0 0",
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
};

const totalLabelCell = {
  color: brand.ink,
  fontSize: "16px",
  fontWeight: "800",
  padding: "10px 0 0",
  textAlign: "right" as const,
};

const totalValueCell = {
  color: brand.ink,
  fontSize: "18px",
  fontWeight: "800",
  padding: "10px 0 0",
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
};

const vatNote = {
  color: brand.muted,
  fontSize: "12px",
  lineHeight: "18px",
  margin: "8px 0 0",
  textAlign: "right" as const,
};

const noticePanel = {
  backgroundColor: brand.panel,
  borderRadius: "14px",
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
