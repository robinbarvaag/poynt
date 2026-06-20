import { ShoppingBag, Trash2 } from "lucide-react";
import type * as React from "react";
import { Button } from "../button";

export interface CartLineItemProps {
  name: string;
  /** Ferdig formatert pris, f.eks. "kr 1 490". */
  priceLabel: string;
  /** Liten produktbilde-slot. Uten bilde vises en dempet plassholder. */
  image?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

/** En rad i handlekurven: miniatyr, navn + pris, og en fjern-knapp. */
export function CartLineItem({
  name,
  priceLabel,
  image,
  onRemove,
  removeLabel = "Fjern",
}: CartLineItemProps) {
  return (
    <li className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {image ?? <ShoppingBag className="size-6 text-muted-foreground" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{name}</p>
        <p className="text-muted-foreground text-sm">{priceLabel}</p>
      </div>

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
