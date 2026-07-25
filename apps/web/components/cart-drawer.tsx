"use client";

import { formatPrice } from "@/lib/format";
import { useCartReady } from "@/lib/use-cart-ready";
import { startVippsCheckout } from "@/lib/vipps-checkout-client";
import { useCart, useCartUi } from "@poynt/cart";
import { Button, CartDrawer as CartDrawerShell, CartLineItem } from "@poynt/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// usePathname er runtime-data under prerendering (cacheComponents) og leses
// derfor i en egen usynlig komponent bak Suspense — den brukes bare som
// trigger for å lukke kurven ved navigasjon.
function CloseOnNavigate({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname brukes som trigger for å lukke kurven ved navigasjon, ikke i selve effekten
  useEffect(() => {
    onNavigate();
  }, [pathname]);
  return null;
}

export function CartDrawer() {
  // Delt UI-tilstand (ikke-persistert): «Legg i handlekurv»-knappene åpner
  // draweren som kjøpsbekreftelse via samme store.
  const { open, setOpen } = useCartUi();
  const ready = useCartReady();
  const { items, removeItem, updateQuantity, clearCart, total, count } =
    useCart();
  const [vippsLoading, setVippsLoading] = useState(false);

  // Inntil klienten har montert behandler vi kurven som tom (se useCartReady).
  const cartItems = ready ? items : [];

  const handleVippsCheckout = async () => {
    setVippsLoading(true);
    try {
      await startVippsCheckout(items);
    } catch (error) {
      console.error("Vipps checkout error:", error);
      alert(error instanceof Error ? error.message : "Noe gikk galt");
      setVippsLoading(false);
    }
  };

  return (
    <>
      <Suspense fallback={null}>
        <CloseOnNavigate onNavigate={() => setOpen(false)} />
      </Suspense>
      <CartDrawerShell
        open={open}
        onOpenChange={setOpen}
        count={ready ? count() : 0}
        total={formatPrice(ready ? total() : 0)}
        onClear={clearCart}
        checkout={
          <div className="space-y-2">
            <Button className="w-full" size="lg" asChild>
              <Link href="/handlekurv" onClick={() => setOpen(false)}>
                Gå til kassen
              </Link>
            </Button>
            <Button
              className="w-full bg-[#ff5b24] text-white hover:bg-[#e04f1c]"
              size="lg"
              onClick={handleVippsCheckout}
              disabled={vippsLoading}
            >
              {vippsLoading ? "Laster..." : "Hurtigkasse med Vipps"}
            </Button>
          </div>
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
                <img
                  src={item.image}
                  alt=""
                  className="size-full object-cover"
                />
              ) : undefined
            }
            onRemove={() => removeItem(item.key)}
          />
        ))}
      </CartDrawerShell>
    </>
  );
}
