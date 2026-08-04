import { resolveCheckoutItems } from "@/lib/checkout-items";
import { resolveCoupon } from "@/lib/coupon";
import { getSessionWithMembership } from "@/lib/membership";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(req.headers);
  if (!rateLimit("checkout", ip, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Vent litt og prøv igjen." },
      { status: 429 }
    );
  }

  try {
    const { items, couponCode, newsletterOptIn } = await req.json();

    // Try to get logged-in user (optional — guests can buy products too)
    const authSession = await getSessionWithMembership(req);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    // Delt servervalidering (samme som Vipps-kassen): produktet må finnes,
    // være aktivt og ikke utsolgt; antall håndheves; klientpris ignoreres.
    const resolved = await resolveCheckoutItems(payload, items);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error, unavailableIds: resolved.unavailableIds },
        { status: 400 }
      );
    }
    const products = resolved.lines;

    for (const p of products) {
      if (!p.product.stripeID) {
        console.error(`Produkt ${p.product.id} mangler Stripe-kopling`);
        return NextResponse.json(
          { error: `«${p.product.name}» kan ikke kjøpes akkurat nå` },
          { status: 400 }
        );
      }
    }

    // Rabattkode → delt kupongmodul (samme vakter som Vipps-kassen); Stripe
    // regner selv ut rabatten i kassen via promotion code-id-en.
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (typeof couponCode === "string" && couponCode.trim()) {
      const subtotal = products.reduce(
        (sum, p) => sum + p.unitPrice * p.quantity,
        0
      );
      const couponResult = await resolveCoupon(couponCode, subtotal);
      if (!couponResult.ok) {
        return NextResponse.json(
          { error: couponResult.error },
          { status: 400 }
        );
      }
      discounts = [{ promotion_code: couponResult.coupon.promoId }];
    }

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
            unit_amount: Math.round(p.product.price * 100),
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
          // Samtykke fra handlekurven fulgte tidligere bare produktkjøp —
          // medlemskapsveien mistet det stille.
          ...(newsletterOptIn === true && { newsletter: "1" }),
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
        ...(newsletterOptIn === true && { newsletter: "1" }),
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/kvittering?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/handlekurv`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Interne feilmeldinger (Stripe/Payload) skal ikke ut til klienten.
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Noe gikk galt i kassen. Prøv igjen om et øyeblikk." },
      { status: 500 }
    );
  }
}
