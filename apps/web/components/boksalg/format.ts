/** Tallformatering for boksalg-dashbordet — norsk, og alltid samme sted. */

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
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function tidspunkt(value: string | null): string {
  if (!value) return "aldri";
  return new Date(value).toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const AVAILABILITY_TEXT: Record<string, string> = {
  unknown: "Ukjent",
  not_listed: "Ikke i katalogen",
  preorder: "Forhåndssalg",
  in_stock: "I salg",
  out_of_stock: "Utsolgt",
};
