"use client";

import { useCart } from "@poynt/cart";
import { Button, Heading, Text } from "@poynt/ui";
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
      <div className="mx-auto max-w-2xl py-16 text-center">
        <Heading
          variant="h1"
          color="foreground"
          weight="bold"
          customStyles="mb-4"
        >
          Handlekurven din er tom
        </Heading>
        <Text variant="muted" customStyles="mb-8">
          Legg til produkt for å starte handelen.
        </Text>
        <Link href="/kurs">
          <Button>Sjå alle kurs</Button>
        </Link>
      </div>
    );
  }

  const totalInKr = total().toFixed(2);

  return (
    <div className="mx-auto max-w-2xl">
      <Heading
        variant="h1"
        color="foreground"
        weight="bold"
        customStyles="mb-8"
      >
        Handlekurv
      </Heading>
      <div className="mb-8 space-y-4">
        {items.map((item) => {
          const priceInKr = item.price.toFixed(2);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl border p-4"
            >
              <div>
                <Heading
                  variant="h4"
                  color="foreground"
                  weight="semibold"
                  customStyles="text-base"
                >
                  {item.name}
                </Heading>
                <Text variant="muted">{priceInKr} kr</Text>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="size-5 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4">
        <Text
          type="div"
          color="foreground"
          weight="bold"
          customStyles="mb-6 flex items-center justify-between text-xl"
        >
          <span>Totalt:</span>
          <span>{totalInKr} kr</span>
        </Text>
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
