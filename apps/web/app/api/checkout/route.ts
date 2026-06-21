import { getSessionWithMembership } from "@/lib/membership";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  try {
    const { items, couponCode } = await req.json();

    // Try to get logged-in user (optional — guests can buy products too)
    const authSession = await getSessionWithMembership(req);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      );
    }

    // Rabattkode → Stripe-promotion-code. Vi løyser den på serveren (aldri
    // stol på klienten) og lar Stripe rekne ut sjølve rabatten i kassen.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (typeof couponCode === "string" && couponCode.trim()) {
      const promos = await stripe.promotionCodes.list({
        code: couponCode.trim(),
        active: true,
        limit: 1,
      });
      const promo = promos.data[0];
      if (!promo || !promo.coupon.valid) {
        return NextResponse.json(
          { error: "Rabattkoden er ugyldig eller utløpt" },
          { status: 400 }
        );
      }
      discounts = [{ promotion_code: promo.id }];
    }

    const payload = await getPayload({ config });

    // Valider produkt og prisar mot databasen. Variant-prisen reknast ut frå
    // produktets variantOptions på serveren – vi stolar aldri på klientprisen.
    const products = await Promise.all(
      items.map(
        async (item: { id: string; quantity: number; variant?: string }) => {
          const product = await payload.findByID({
            collection: "products",
            id: item.id,
          });

          if (!product || !product.active) {
            throw new Error(`Produkt ${item.id} er ikkje tilgjengeleg`);
          }

          if (!product.stripeID) {
            throw new Error(`Produkt ${item.id} manglar Stripe-kopling`);
          }

          const variantOption = item.variant
            ? (product.variantOptions ?? []).find(
                (o) => o.label === item.variant
              )
            : undefined;
          const unitPrice = product.price + (variantOption?.priceDelta ?? 0);

          return {
            product,
            quantity: Math.max(1, Math.floor(item.quantity || 1)),
            variant: item.variant,
            unitPrice,
          };
        }
      )
    );

    const isMembership = products.some((p) => p.product.type === "membership");

    // Membership og vanleg produkt kan ikkje blandast i same Stripe-sesjon
    if (isMembership && products.length > 1) {
      return NextResponse.json(
        { error: "Medlemskap kan ikkje kjøpast saman med andre produkt" },
        { status: 400 }
      );
    }

    if (isMembership) {
      const memberProduct = products[0].product;
      const tier = memberProduct.membershipTier || "community";

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
        products.map((p) => ({
          price_data: {
            currency: "nok",
            product: p.product.stripeID as string,
            unit_amount: p.product.price * 100,
            recurring: {
              interval: "month" as const,
              interval_count: p.product.recurringInterval || 1,
            },
          },
          quantity: p.quantity,
        }));

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: lineItems,
        ...(discounts && { discounts }),
        ...(authSession && { customer_email: authSession.user.email }),
        metadata: {
          productType: "membership",
          tier,
          ...(authSession && { userId: authSession.user.id }),
        },
        subscription_data: {
          metadata: { tier },
        },
        success_url: `${process.env.NEXT_PUBLIC_URL}/kvittering?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/produkter/${memberProduct.slug}`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Vanleg produktkjøp (eingongs)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      products.map((p) => ({
        price_data: {
          currency: "nok",
          product: p.product.stripeID as string,
          unit_amount: Math.round(p.unitPrice * 100),
        },
        quantity: p.quantity,
      }));

    // Kompakt kurv-samandrag på sesjonen, så webhooken kan lagre antal +
    // variant på ordren (Stripe-line-items ber ikkje variantvalet).
    const cartMeta = JSON.stringify(
      products.map((p) => ({
        id: String(p.product.id),
        q: p.quantity,
        v: p.variant ?? null,
      }))
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      ...(discounts && { discounts }),
      ...(authSession && { customer_email: authSession.user.email }),
      metadata: {
        ...(cartMeta.length <= 500 && { cart: cartMeta }),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/kvittering?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/handlekurv`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Noko gjekk gale" },
      { status: 500 }
    );
  }
}
