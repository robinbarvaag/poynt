"use client";

import { formatPrice } from "@/lib/format";
import { useCartReady } from "@/lib/use-cart-ready";
import { useCart } from "@poynt/cart";
import { Button, CartDrawer as CartDrawerShell, CartLineItem } from "@poynt/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const ready = useCartReady();
  const pathname = usePathname();
  const { items, removeItem, updateQuantity, clearCart, total, count } =
    useCart();

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
      count={ready ? count() : 0}
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
          key={item.key}
          name={item.name}
          priceLabel={formatPrice(item.price * item.quantity)}
          variantLabel={
            item.variantLabel && item.variantValue
              ? `${item.variantLabel} ${item.variantValue}`
              : undefined
          }
          quantity={item.quantity}
          incrementDisabled={
            item.maxQuantity != null && item.quantity >= item.maxQuantity
          }
          onIncrement={() => updateQuantity(item.key, item.quantity + 1)}
          onDecrement={() => updateQuantity(item.key, item.quantity - 1)}
          image={
            item.image ? (
              <img src={item.image} alt="" className="size-full object-cover" />
            ) : undefined
          }
          onRemove={() => removeItem(item.key)}
        />
      ))}
    </CartDrawerShell>
  );
}
