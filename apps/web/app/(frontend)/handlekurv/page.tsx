"use client";

import { VippsButton } from "@/components/vipps-button";
import { formatPrice } from "@/lib/format";
import { useCartReady } from "@/lib/use-cart-ready";
import { startVippsCheckout } from "@/lib/vipps-checkout-client";
import { useCart } from "@poynt/cart";
import {
  Button,
  CartLineItem,
  Container,
  FloatingShapes,
  GridPattern,
  Heading,
  Input,
  Text,
} from "@poynt/ui";
import { ArrowLeft, ShieldCheck, ShoppingBag, Tag, X, Zap } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

type AppliedCoupon = {
  code: string;
  percentOff: number | null;
  amountOffKr: number | null;
  label: string;
};

/** Rabatt i kr ut fra dagens delsum — så den følger antalsendringer. */
function couponDiscount(
  coupon: AppliedCoupon | null,
  subtotal: number
): number {
  if (!coupon) return 0;
  if (coupon.percentOff != null) return (subtotal * coupon.percentOff) / 100;
  if (coupon.amountOffKr != null) return Math.min(coupon.amountOffKr, subtotal);
  return 0;
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, count } = useCart();
  const ready = useCartReady();
  const [isLoading, setIsLoading] = useState(false);
  const [vippsLoading, setVippsLoading] = useState(false);
  // Nyhetsbrev-samtykke: må starte uavkrysset (aktivt samtykke, mfl. § 15)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Rabattkode
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Tom til klienten har montert — server og første render må være like.
  const cartItems = ready ? items : [];

  const applyCoupon = async (e: FormEvent) => {
    e.preventDefault();
    const code = couponInput.trim();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: total() }),
      });
      const data = await res.json();

      if (!data.valid) {
        setCoupon(null);
        setCouponError(data.error || "Ugyldig kode");
        return;
      }

      setCoupon({
        code: data.code,
        percentOff: data.percentOff ?? null,
        amountOffKr: data.amountOffKr ?? null,
        label: data.label,
      });
      setCouponInput("");
    } catch {
      setCouponError("Kunne ikke sjekke koden akkurat nå");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

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
            variant: item.variantValue,
          })),
          couponCode: coupon?.code,
          newsletterOptIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Noe gikk galt");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert(error instanceof Error ? error.message : "Noe gikk galt");
      setIsLoading(false);
    }
  };

  const handleVippsCheckout = async () => {
    setVippsLoading(true);
    try {
      await startVippsCheckout(items, coupon?.code, newsletterOptIn);
    } catch (error) {
      console.error("Vipps checkout error:", error);
      alert(error instanceof Error ? error.message : "Noe gikk galt");
      setVippsLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container size="sm" padding="xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center">
          <FloatingShapes variant="subtle" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-accent-3/40">
              <ShoppingBag className="size-9 text-primary" />
            </div>
            <Heading
              variant="h1"
              color="foreground"
              weight="bold"
              customStyles="mb-3"
            >
              Handlekurven din er tom
            </Heading>
            <Text variant="muted" customStyles="mb-8 max-w-sm">
              Utforsk produktene våre og legg noe i kurven for å komme i gang.
            </Text>
            <Link href="/produkter">
              <Button size="lg">Se alle produkter</Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  // cartItems er garantert = items her (vi har returnert tidlig hvis tom)
  const itemCount = count();
  const discount = couponDiscount(coupon, total());
  const grandTotal = Math.max(0, total() - discount);

  return (
    <Container size="default" padding="xl">
      <div className="mb-8">
        <Heading variant="h1" color="foreground" weight="bold">
          Handlekurv
        </Heading>
        <Text variant="muted" customStyles="mt-2">
          {itemCount} {itemCount === 1 ? "produkt" : "produkter"} klare til kjøp
        </Text>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Varer */}
        <div className="lg:col-span-2">
          <ul className="space-y-3">
            {items.map((item) => (
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
          </ul>

          <Link
            href="/produkter"
            className="mt-6 inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Fortsett å handle
          </Link>
        </div>

        {/* Sammendrag */}
        <aside className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm">
            <GridPattern fade className="text-primary/10" />
            <div className="relative z-10">
              <Heading
                variant="h2"
                color="foreground"
                weight="bold"
                customStyles="mb-5 text-lg"
              >
                Sammendrag
              </Heading>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Delsum</span>
                  <span className="tabular-nums">{formatPrice(total())}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Mva</span>
                  <span>Inkludert</span>
                </div>
                {coupon && discount > 0 && (
                  <div className="flex items-center justify-between font-medium text-primary">
                    <span className="flex items-center gap-1.5">
                      <Tag className="size-3.5" />
                      {coupon.code}
                    </span>
                    <span className="tabular-nums">
                      −{formatPrice(discount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Rabattkode */}
              {coupon ? (
                <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-accent-3/30 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <Tag className="size-4 shrink-0 text-primary" />
                    <span className="truncate font-medium">{coupon.code}</span>
                    <span className="shrink-0 text-muted-foreground text-xs">
                      {coupon.label}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    aria-label="Fjern rabattkode"
                    className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={applyCoupon} className="mt-4">
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Rabattkode"
                      aria-label="Rabattkode"
                      className="h-10"
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      className="h-10 shrink-0"
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? "..." : "Bruk"}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="mt-1.5 text-destructive text-xs">
                      {couponError}
                    </p>
                  )}
                </form>
              )}

              <div className="mt-4 flex items-center justify-between border-border border-t pt-4">
                <span className="font-bold text-foreground">Totalt</span>
                <span className="font-bold text-foreground text-xl tabular-nums">
                  {formatPrice(grandTotal)}
                </span>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-muted-foreground text-sm">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span>
                  Ja takk, jeg vil motta nyhetsbrev med tips og tilbud fra
                  Poynt. Du kan melde deg av når som helst.
                </span>
              </label>

              <Button
                size="lg"
                className="mt-4 w-full"
                onClick={handleCheckout}
                disabled={isLoading || vippsLoading}
              >
                {isLoading ? "Laster..." : "Gå til kassen"}
              </Button>

              {/* Offisiell Vipps-knapp — retningslinjene tillater ikke egen design. */}
              <VippsButton
                stretched
                className="mt-3"
                loading={vippsLoading}
                disabled={isLoading}
                onClick={handleVippsCheckout}
              />

              <ul className="mt-5 space-y-2.5 text-muted-foreground text-sm">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-primary" />
                  Sikker betaling med Stripe eller Vipps
                </li>
                <li className="flex items-center gap-2.5">
                  <Zap className="size-4 shrink-0 text-primary" />
                  Tilgang umiddelbart etter kjøp
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </Container>
  );
}
