"use client";

import { cn } from "@poynt/ui";
import { ShoppingCart, Trash2 } from "lucide-react";
import type * as React from "react";
import { Button } from "../button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../sheet";

export interface CartDrawerProps {
  /** Antall varer — styrer telleren og «pop»-en på triggeren. */
  count: number;
  /** Ferdig formatert totalsum, f.eks. "kr 3 480". */
  total: string;
  /** Radene i kurven (CartLineItem-elementer). */
  children?: React.ReactNode;
  onClear?: () => void;
  /** Checkout-knapp (appen sender en lenke-knapp). */
  checkout?: React.ReactNode;
  /** CTA i tom-tilstanden (appen sender en lenke-knapp). */
  emptyAction?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  clearLabel?: string;
  totalLabel?: string;
  /** Kontrollert åpen-tilstand. Utelat for ukontrollert (bruk `defaultOpen`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

/**
 * Handlekurv-drawer: en `Sheet` med en trigger som «popper» (saffron-fylt med
 * teller) når den har varer, og rolig ghost-ikon når den er tom. Presentasjons-
 * only — varer, totalsum og handlinger sendes inn. Appen kobler på cart-storen.
 */
export function CartDrawer({
  count,
  total,
  children,
  onClear,
  checkout,
  emptyAction,
  emptyTitle = "Ingen produkter ennå",
  emptyDescription = "Utforsk produktene våre og legg noe i kurven",
  clearLabel = "Tøm handlekurv",
  totalLabel = "Totalt",
  open,
  onOpenChange,
  defaultOpen,
}: CartDrawerProps) {
  const hasItems = count > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} defaultOpen={defaultOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          aria-label="Handlekurv"
          variant={hasItems ? "saffron" : "ghost"}
          size="sm"
          className={cn(
            "h-9 gap-1.5 rounded-full px-2.5",
            !hasItems && "size-9 px-0"
          )}
        >
          <ShoppingCart className="size-5" />
          {hasItems && (
            <span className="font-semibold text-sm tabular-nums">{count}</span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            Handlekurv
          </SheetTitle>
          <SheetDescription>
            {hasItems
              ? `${count} ${count === 1 ? "produkt" : "produkter"} i kurven`
              : "Handlekurven din er tom"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {hasItems ? (
            <ul className="space-y-3">{children}</ul>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="size-10 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{emptyTitle}</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {emptyDescription}
                </p>
              </div>
              {emptyAction}
            </div>
          )}
        </div>

        {hasItems && (
          <div className="space-y-4 border-border border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{totalLabel}</span>
              <span className="font-semibold text-lg">{total}</span>
            </div>
            <div className="space-y-2">
              {checkout}
              {onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={onClear}
                >
                  <Trash2 className="mr-2 size-4" />
                  {clearLabel}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
