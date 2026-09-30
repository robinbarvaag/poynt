"use client";

import { useRowLabel } from "@payloadcms/ui";

/**
 * Radetiketter for lukkede array-rader i admin, så «Nav Item 01» erstattes
 * med faktisk innhold (lenketekst/kolonnetittel).
 */

export function LinkRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string }>();
  return <span>{data?.label || `Lenke ${(rowNumber ?? 0) + 1}`}</span>;
}

export function ProgramRowLabel() {
  const { data, rowNumber } = useRowLabel<{ time?: string; title?: string }>();
  const label = [data?.time, data?.title].filter(Boolean).join(" · ");
  return <span>{label || `Programpunkt ${(rowNumber ?? 0) + 1}`}</span>;
}

export function QuestionRowLabel() {
  const { data, rowNumber } = useRowLabel<{ label?: string }>();
  return <span>{data?.label || `Spørsmål ${(rowNumber ?? 0) + 1}`}</span>;
}

export function ColumnRowLabel() {
  const { data, rowNumber } = useRowLabel<{ title?: string }>();
  return <span>{data?.title || `Kolonne ${(rowNumber ?? 0) + 1}`}</span>;
}

/**
 * Salgskanal i «Bokøkonomi». Viser hva kanalen faktisk koster i lukket
 * tilstand, så man ser at bokhandel tar 50 % uten å åpne raden.
 */
export function ChannelRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    label?: string;
    retailerPercent?: number;
    active?: boolean;
    presale?: { enabled?: boolean; retailerPercent?: number };
  }>();
  const name = data?.label || `Kanal ${(rowNumber ?? 0) + 1}`;
  const cut = data?.retailerPercent
    ? `${data.retailerPercent} % til forhandler`
    : "ingen forhandler";
  const presale = data?.presale?.enabled
    ? ` · forhåndssalg ${data.presale.retailerPercent ?? 0} % + kickback`
    : "";
  return (
    <span>
      {name} · {cut}
      {presale}
      {data?.active === false ? " · inaktiv" : ""}
    </span>
  );
}

/** Ett trinn i kickback-trappa: «fra 50 bøker: 5 %». */
export function KickbackTierRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    copies?: number;
    percent?: number;
  }>();
  if (!data?.copies) return <span>Trinn {(rowNumber ?? 0) + 1}</span>;
  return (
    <span>
      Fra {data.copies} bøker: {data.percent ?? 0} %
    </span>
  );
}
