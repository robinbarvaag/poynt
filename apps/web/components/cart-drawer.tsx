"use client";

import { useCartReady } from "@/lib/use-cart-ready";
import { useCart } from "@poynt/cart";
import { Button, CartDrawer as CartDrawerShell, CartLineItem } from "@poynt/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(price);
}

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const ready = useCartReady();
  const pathname = usePathname();
  const { items, removeItem, clearCart, total } = useCart();

  // Lukk kurven ved navigasjon. `pathname` er en bevisst trigger.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname brukes som trigger for å lukke kurven ved navigasjon, ikke i selve effekten
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Inntil klienten har montert behandler vi kurven som tom (se useCartReady).
  const cartItems = ready ? items : [];

  return (
    <CartDrawerShell
      open={open}
      onOpenChange={setOpen}
      count={cartItems.length}
      total={formatPrice(ready ? total() : 0)}
      onClear={clearCart}
      checkout={
        <Button className="w-full" size="lg" asChild>
          <Link href="/handlekurv" onClick={() => setOpen(false)}>
            Gå til kassen
          </Link>
        </Button>
      }
      emptyAction={
        <Button variant="outline" asChild>
          <Link href="/produkter" onClick={() => setOpen(false)}>
            Se produkter
          </Link>
        </Button>
      }
    >
      {cartItems.map((item) => (
        <CartLineItem
          key={item.id}
          name={item.name}
          priceLabel={formatPrice(item.price)}
          onRemove={() => removeItem(item.id)}
        />
      ))}
    </CartDrawerShell>
  );
}
