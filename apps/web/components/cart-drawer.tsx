"use client";

import { useCart } from "@poynt/cart";
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Text,
} from "@poynt/ui";
import { ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatPrice(priceInOre: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(priceInOre / 100);
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, removeItem, clearCart, total } = useCart();
  const itemCount = items.length;
  const cartTotal = total();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Cart trigger button */}
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-4 w-4" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
            {itemCount}
          </span>
        )}
      </Button>

      <SheetContent className="flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Handlekurv
          </SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Handlekurven din er tom"
              : `${itemCount} ${itemCount === 1 ? "produkt" : "produkter"} i kurven`}
          </SheetDescription>
        </SheetHeader>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <Text className="font-medium">Ingen produkter ennå</Text>
                <Text variant="subtle" className="mt-1">
                  Utforsk våre produkter og legg noe i kurven
                </Text>
              </div>
              <Button variant="outline" onClick={() => setOpen(false)} asChild>
                <Link href="/produkter">Se produkter</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 p-3 rounded-lg bg-card border border-border"
                >
                  {/* Product placeholder image */}
                  <div className="w-16 h-16 rounded-md bg-muted flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <Text className="font-medium truncate">{item.name}</Text>
                    <Text variant="subtle" className="text-sm">
                      {formatPrice(item.price)}
                    </Text>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Fjern {item.name}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer with total and checkout */}
        {itemCount > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <Text className="font-medium">Totalt</Text>
              <Text className="text-lg font-semibold">
                {formatPrice(cartTotal)}
              </Text>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button className="w-full" size="lg" asChild>
                <Link href="/handlekurv" onClick={() => setOpen(false)}>
                  Gå til kassen
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => clearCart()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Tøm handlekurv
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
