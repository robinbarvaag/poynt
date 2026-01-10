"use client";

import Link from "next/link";
import { useCart } from "@poynt/cart";
import { Button } from "@poynt/ui";
import { ShoppingCart } from "lucide-react";

export function Header() {
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Poynt
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/kurs">
            <Button variant="ghost">Kurs</Button>
          </Link>
          <Link href="/min-side">
            <Button variant="ghost">Min side</Button>
          </Link>
          <Link href="/handlekurv">
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
