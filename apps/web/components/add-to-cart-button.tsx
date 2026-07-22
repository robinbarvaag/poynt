"use client";

import { useCartReady } from "@/lib/use-cart-ready";
import { useCart } from "@poynt/cart";
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
  /** Variant-spørsmål, t.d. «Signert?». */
  variantLabel?: string;
  /** Valgt variant, t.d. «Ja». */
  variantValue?: string;
  /** Antal som legges til ved klikk (default 1). */
  quantity?: number;
  /** Maks antal per linje (digitale: 1). */
  maxQuantity?: number;
  /** Når true kan ein leggje til fleire – knappen låser seg ikkje. */
  allowQuantity?: boolean;
  /** Deaktiver (t.d. variant ikkje valgt enno). */
  disabled?: boolean;
  /** Tekst når knappen er deaktivert pga. manglande variantvalg. */
  disabledLabel?: string;
}

export function AddToCartButton({
  product,
  variantLabel,
  variantValue,
  quantity = 1,
  maxQuantity,
  allowQuantity = false,
  disabled = false,
  disabledLabel = "Velg eit alternativ",
}: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const ready = useCartReady();
  const [added, setAdded] = useState(false);

  const key = variantValue ? `${product.id}::${variantValue}` : product.id;

  // Behandle som «ikke i kurv» til klienten har montert (unngår hydration-
  // mismatch på knapptilstanden — se useCartReady).
  const isInCart = ready && items.some((item) => item.key === key);

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
  };

  if (disabled) {
    return (
      <Button size="lg" className="w-full" disabled>
        {disabledLabel}
      </Button>
    );
  }

  // Digitale eingongsprodukt: éin av kvar – lås når den ligg i kurven.
  if (!allowQuantity && isInCart) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Check className="mr-2 h-5 w-5" />
        Allereie i handlekurv
      </Button>
    );
  }

  return (
    <Button size="lg" className="w-full" onClick={handleAddToCart}>
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
