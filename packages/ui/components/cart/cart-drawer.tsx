"use client";

import { cn } from "@poynt/ui";
import { ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
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
  /**
   * Liten trygghets-linje under checkout-knappen. Send `null` for å skjule den,
   * eller en egen node for å overstyre standardteksten.
   */
  checkoutNote?: React.ReactNode;
  /** Kontrollert åpen-tilstand. Utelat for ukontrollert (bruk `defaultOpen`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

/**
 * Handlekurv-drawer: en `Sheet` med en trigger som «popper» (accent-5/saffron-fylt med
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
  clearLabel = "Tøm kurven",
  totalLabel = "Totalt",
  checkoutNote,
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
          variant={hasItems ? "accent-5" : "ghost"}
          size="sm"
          className={cn(
            "h-9 gap-2 rounded-full px-3.5",
            !hasItems && "size-9 px-0"
          )}
        >
          <ShoppingCart className="size-5" />
          {hasItems && (
            <span
              // `key={count}` remonterer spennet når tallet endres, så «pop»-en
              // (zoom-in) spilles av hver gang en vare legges til / fjernes.
              key={count}
              className="font-semibold text-sm tabular-nums duration-200 animate-in zoom-in-50"
            >
              {count}
            </span>
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
          <div className="border-border border-t bg-background px-6 pt-4 pb-5">
            {/* Sum: etikett + «inkl. mva» til venstre, stor sum til høyre. */}
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{totalLabel}</span>
                <span className="text-muted-foreground text-xs">Inkl. mva</span>
              </div>
              <span className="font-semibold text-2xl tabular-nums tracking-tight">
                {total}
              </span>
            </div>

            <div className="mt-4 space-y-2">{checkout}</div>

            {/* Én rolig linje under knappene: trygghet til venstre, tøm som en
                liten tekst-handling til høyre — lav emfase, så den ikke
                konkurrerer med betalingsknappene. */}
            {(checkoutNote !== null || onClear) && (
              <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                {checkoutNote === null ? (
                  <span />
                ) : (
                  <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                      {checkoutNote ?? "Sikker betaling · tilgang umiddelbart"}
                    </span>
                  </p>
                )}
                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Trash2 className="size-3.5" />
                    {clearLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
