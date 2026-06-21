import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import type * as React from "react";
import { Button } from "../button";

export interface CartLineItemProps {
  name: string;
  /** Ferdig formatert pris, f.eks. "kr 1 490" (samla for linja). */
  priceLabel: string;
  /** Liten produktbilde-slot. Uten bilde vises en dempet plassholder. */
  image?: React.ReactNode;
  /** Valgt variant vist under navnet, f.eks. "Signert: Ja". */
  variantLabel?: string;
  /** Antal på linja. Vises som en stepper når onIncrement/onDecrement er satt. */
  quantity?: number;
  /** Deaktiver «+» (t.d. ved nådd maks antal). */
  incrementDisabled?: boolean;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
}

/** En rad i handlekurven: miniatyr, navn + variant + pris, antal-stepper og fjern-knapp. */
export function CartLineItem({
  name,
  priceLabel,
  image,
  variantLabel,
  quantity,
  incrementDisabled,
  onIncrement,
  onDecrement,
  onRemove,
  removeLabel = "Fjern",
}: CartLineItemProps) {
  const showStepper = quantity != null && (onIncrement || onDecrement);

  return (
    <li className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-foreground/20">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {image ?? <ShoppingBag className="size-6 text-muted-foreground" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        {variantLabel && (
          <p className="truncate text-muted-foreground text-xs">
            {variantLabel}
          </p>
        )}
        <p className="text-muted-foreground text-sm">{priceLabel}</p>
      </div>

      {showStepper && (
        <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Færre"
            className="size-7 rounded-full"
            onClick={onDecrement}
            disabled={quantity != null && quantity <= 1}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-5 text-center font-medium text-sm tabular-nums">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fleire"
            className="size-7 rounded-full"
            onClick={onIncrement}
            disabled={incrementDisabled}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      )}

      {onRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`${removeLabel} ${name}`}
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </li>
  );
}
