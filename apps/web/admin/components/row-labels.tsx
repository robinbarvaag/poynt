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
  }>();
  const name = data?.label || `Kanal ${(rowNumber ?? 0) + 1}`;
  const cut = data?.retailerPercent
    ? `${data.retailerPercent} % til forhandler`
    : "ingen forhandler";
  return (
    <span>
      {name} · {cut}
      {data?.active === false ? " · inaktiv" : ""}
    </span>
  );
}
