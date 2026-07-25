"use client";

import { useCartReady } from "@/lib/use-cart-ready";
import { useCart, useCartUi } from "@poynt/cart";
import { Button } from "@poynt/ui";
import { Check } from "lucide-react";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  slug?: string;
  image?: string;
}

interface AddToCartButtonProps {
  product: Product;
  /** Variant-spørsmål, f.eks. «Signert?». */
  variantLabel?: string;
  /** Valgt variant, f.eks. «Ja». */
  variantValue?: string;
  /** Antall som legges til ved klikk (default 1). */
  quantity?: number;
  /** Maks antall per linje (digitale: 1). */
  maxQuantity?: number;
  /** Når true kan man legge til flere – knappen låser seg ikke. */
  allowQuantity?: boolean;
  /** Deaktiver (f.eks. variant ikke valgt ennå). */
  disabled?: boolean;
  /** Tekst når knappen er deaktivert pga. manglende variantvalg. */
  disabledLabel?: string;
  /** Ekstra klasser på knappen – brukes når den bygges inn i en samlet
      kontroll (f.eks. antall-stepper + knapp i samme pill). */
  className?: string;
}

export function AddToCartButton({
  product,
  variantLabel,
  variantValue,
  quantity = 1,
  maxQuantity,
  allowQuantity = false,
  disabled = false,
  disabledLabel = "Velg et alternativ",
  className,
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const openCart = useCartUi((state) => state.openCart);
  const ready = useCartReady();
  const [added, setAdded] = useState(false);

  const key = variantValue ? `${product.id}::${variantValue}` : product.id;

  // Behandle som «ikke i kurv» til klienten har montert (unngår hydration-
  // mismatch på knapptilstanden — se useCartReady).
  const isInCart = ready && items.some((item) => item.key === key);

  const buttonClasses = className ? `w-full ${className}` : "w-full";

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        variantLabel,
        variantValue,
        maxQuantity,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    // Drawer-en åpnes som kjøpsbekreftelse – med et lite beat først, så
    // «Lagt til!»-swappen på knappen rekker å registreres før overlayet.
    setTimeout(openCart, 450);
  };

  if (disabled) {
    return (
      <Button size="lg" className={buttonClasses} disabled>
        {disabledLabel}
      </Button>
    );
  }

  // Digitale engangsprodukter: én av hver – lås når den ligger i kurven.
  if (!allowQuantity && isInCart) {
    return (
      <Button size="lg" className={buttonClasses} disabled>
        <Check className="mr-2 h-5 w-5" />
        Allerede i handlekurven
      </Button>
    );
  }

  return (
    <Button size="lg" className={buttonClasses} onClick={handleAddToCart}>
      {/* key-remount + swap-in gir en myk blur-fade mellom tilstandene i
          stedet for at teksten snapper. */}
      <span
        key={added ? "added" : "idle"}
        className="swap-in inline-flex items-center"
      >
        {added ? (
          <>
            <Check className="mr-2 h-5 w-5" />
            Lagt til!
          </>
        ) : (
          "Legg i handlekurv"
        )}
      </span>
    </Button>
  );
}
