"use client";

import { useCart } from "@poynt/cart";
import { Button } from "@poynt/ui/button";
import { useState } from "react";
import { Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const isInCart = items.some((item) => item.id === product.id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (isInCart) {
    return (
      <Button size="lg" className="w-full" disabled>
        <Check className="mr-2 h-5 w-5" />
        Allereie i handlekurv
      </Button>
    );
  }

  return (
    <Button size="lg" className="w-full" onClick={handleAddToCart}>
      {added ? (
        <>
          <Check className="mr-2 h-5 w-5" />
          Lagt til!
        </>
      ) : (
        "Legg i handlekurv"
      )}
    </Button>
  );
}
