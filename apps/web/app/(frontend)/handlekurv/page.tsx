"use client";

import { useCart } from "@poynt/cart";
import { Button } from "@poynt/ui";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, total } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Noko gjekk gale");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Noko gjekk gale");
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-3xl font-bold mb-4">Handlekurven din er tom</h1>
        <p className="text-muted-foreground mb-8">
          Legg til produkt for å starte handelen.
        </p>
        <Link href="/kurs">
          <Button>Sjå alle kurs</Button>
        </Link>
      </div>
    );
  }

  const totalInKr = (total() / 100).toFixed(2);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Handlekurv</h1>
      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const priceInKr = (item.price / 100).toFixed(2);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between border rounded-lg p-4"
            >
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-muted-foreground">{priceInKr} kr</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-5 w-5 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-xl font-bold mb-6">
          <span>Totalt:</span>
          <span>{totalInKr} kr</span>
        </div>
        <Button
          size="lg"
          className="w-full"
          onClick={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? "Lastar..." : "Gå til kassen"}
        </Button>
      </div>
    </div>
  );
}
