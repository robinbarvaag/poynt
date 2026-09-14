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
