/**
 * MVA-regning for nettbutikken. Alle priser er INKLUDERT MVA, så MVA-beløpet
 * regnes «baklengs» fra bruttobeløpet: brutto × sats / (100 + sats).
 *
 * Rabattkoder trekkes fra totalen, ikke fra enkeltlinjer. MVA-beløpet
 * skaleres derfor med forholdet mellom faktisk betalt total og summen av
 * linjene, så «herav MVA» stemmer med det kunden faktisk betalte.
 */

/** Produktets `vatRate` er et select-felt (streng). Ukjent/tomt → 25. */
export function parseVatRate(
  value: string | number | null | undefined
): number {
  const n = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(n) && n >= 0 ? n : 25;
}

/** MVA-andelen (kr) av et bruttobeløp med gitt sats. */
export function vatPortion(gross: number, ratePercent: number): number {
  if (ratePercent <= 0) return 0;
  return (gross * ratePercent) / (100 + ratePercent);
}

export interface VatLine {
  /** Bruttopris per enhet (inkl. MVA), i kr. */
  unitPrice: number;
  quantity: number;
  ratePercent: number;
}

/**
 * Samlet MVA (kr, to desimaler) for en ordre. `paidTotal` er beløpet kunden
 * faktisk betalte etter rabatt; er det lavere enn linjesummen, skaleres MVA
 * tilsvarende.
 */
export function calculateVatTotal(lines: VatLine[], paidTotal: number): number {
  const linesGross = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const linesVat = lines.reduce(
    (s, l) => s + vatPortion(l.unitPrice * l.quantity, l.ratePercent),
    0
  );
  if (linesGross <= 0) return 0;
  const factor = Math.min(1, Math.max(0, paidTotal / linesGross));
  return Math.round(linesVat * factor * 100) / 100;
}
