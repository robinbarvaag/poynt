"use client";

import { useRowLabel } from "@payloadcms/ui";
import type { DefaultCellComponentProps } from "payload";

type OrderItemData = {
  name?: string | null;
  quantity?: number | null;
  variant?: string | null;
  priceAtPurchase?: number | null;
  product?: number | string | { name?: string | null } | null;
};

/** «Verdifull vekst i din bedrift × 2 · Signert: Ja». */
function describeItem(item: OrderItemData, fallback: string): string {
  const name =
    item.name ||
    (typeof item.product === "object" && item.product?.name) ||
    fallback;
  const qty = item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : "";
  const variant = item.variant ? ` · ${item.variant}` : "";
  return `${name}${qty}${variant}`;
}

/**
 * Radetikett for lukkede varelinjer på en bestilling, så «Item 01» blir
 * «Verdifull vekst i din bedrift × 2 · 399 kr».
 */
export function OrderItemRowLabel() {
  const { data, rowNumber } = useRowLabel<OrderItemData>();
  const label = describeItem(data ?? {}, `Vare ${(rowNumber ?? 0) + 1}`);
  const price =
    typeof data?.priceAtPurchase === "number"
      ? ` · ${data.priceAtPurchase} kr`
      : "";
  return (
    <span>
      {label}
      {price}
    </span>
  );
}

/**
 * «Varer»-kolonnen i bestillingslista: varenavnene rett i tabellen, så
 * Susanne slipper å åpne hver bestilling for å se hva som er kjøpt.
 */
export function OrderItemsCell({ cellData }: DefaultCellComponentProps) {
  const items = Array.isArray(cellData) ? (cellData as OrderItemData[]) : [];
  if (items.length === 0) return <span>–</span>;
  const named = items.map((item, index) =>
    describeItem(item, `Vare ${index + 1}`)
  );
  return <span title={named.join("\n")}>{named.join(", ")}</span>;
}
