import { BOOK_TIME_ZONE } from "@/lib/boksalg/dates";

/**
 * Tallformatering for boksalg-dashbordet — norsk, og alltid samme sted.
 *
 * Alle tidspunkt formateres i norsk tid (ikke serverens, som er UTC på
 * Vercel), ellers viser server og nettleser ulik tekst for samme tidspunkt og
 * «sist hentet» står to timer feil.
 */

export function kr(value: number, decimals = 0): string {
  return `${value.toLocaleString("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} kr`;
}

export function antall(value: number): string {
  return value.toLocaleString("nb-NO");
}

export function dato(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("nb-NO", {
    timeZone: BOOK_TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function tidspunkt(value: string | null): string {
  if (!value) return "aldri";
  return new Date(value).toLocaleString("nb-NO", {
    timeZone: BOOK_TIME_ZONE,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * En dagnøkkel («2026-10-15») som kort dato («15. okt.»). Nøkkelen er
 * allerede en norsk dag, så den tolkes som UTC-midnatt og formateres i UTC —
 * da kan ingen tidssone flytte den til dagen før.
 */
export function kortDag(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return date.toLocaleDateString("nb-NO", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  });
}

export const AVAILABILITY_TEXT: Record<string, string> = {
  unknown: "Ukjent",
  not_listed: "Ikke i katalogen",
  preorder: "Forhåndssalg",
  in_stock: "I salg",
  out_of_stock: "Utsolgt",
};
