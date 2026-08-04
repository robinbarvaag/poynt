import { resolveCheckoutItems } from "@/lib/checkout-items";
import { discountedTotal, resolveCoupon } from "@/lib/coupon";
import { getSessionWithMembership } from "@/lib/membership";
import { createVippsPayment } from "@/lib/vipps";
import config from "@/payload.config";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Hurtigkasse med Vipps: validerer kurven mot databasen, opprettar ein
 * pending-ordre i Payload, og sender kunden til Vipps-landingssida.
 * Kundens navn/e-post hentast via profile sharing i appen — resten skjer i
 * webhooken (/api/webhooks/vipps): capture, ordre → betalt, kvitterings-epost.
 */
export async function POST(req: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(req.headers);
  if (!rateLimit("vipps-checkout", ip, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Vent litt og prøv igjen." },
      { status: 429 }
    );
  }

  try {
    const { items, couponCode, newsletterOptIn } = await req.json();

    const authSession = await getSessionWithMembership(req);

    const payload = await getPayload({ config });

    // Delt servervalidering (samme som Stripe-kassen): produktet må finnes,
    // være aktivt og ikke utsolgt; antall håndheves; klientpris ignoreres.
    const resolved = await resolveCheckoutItems(payload, items);
    if (!resolved.ok) {
      return NextResponse.json(
        { error: resolved.error, unavailableIds: resolved.unavailableIds },
        { status: 400 }
      );
    }
    const products = resolved.lines;

    // Vipps-flyten støttar ikkje gjentakande betaling — medlemskap må via kort.
    if (products.some((p) => p.product.type === "membership")) {
      return NextResponse.json(
        { error: "Medlemskap må kjøpast med kort" },
        { status: 400 }
      );
    }

    let total = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

    // Rabattkodane bur i Stripe — delt kupongmodul (samme vakter som
    // Stripe-kassen), men her reknar vi rabatten sjølv sidan Vipps ikkje
    // kjenner Stripe-promotion-codes.
    if (typeof couponCode === "string" && couponCode.trim()) {
      const couponResult = await resolveCoupon(couponCode, total);
      if (!couponResult.ok) {
        return NextResponse.json(
          { error: couponResult.error },
          { status: 400 }
        );
      }
      total = discountedTotal(total, couponResult.coupon);
    }

    const amountValue = Math.round(total * 100); // øre
    if (amountValue < 100) {
      return NextResponse.json(
        { error: "Beløpet er for lågt for Vipps" },
        { status: 400 }
      );
    }

    // Pending-ordre først, så vi har ein stad å lande webhooken. Referansen
    // må vere unik hos Vipps ([a-zA-Z0-9-], 8–64 teikn).
    const order = await payload.create({
      collection: "orders",
      draft: false,
      data: {
        customerEmail: authSession?.user.email || undefined,
        customerName: authSession?.user.name || undefined,
        items: products.map((p) => ({
          product: p.product.id,
          quantity: p.quantity,
          variant:
            p.variant && p.product.variantLabel
              ? `${p.product.variantLabel} ${p.variant}`
              : (p.variant ?? undefined),
          priceAtPurchase: p.unitPrice,
        })),
        // Eksakt beløp i kr (kan ha øredesimaler ved rabatt). MÅ samsvare med
        // amountValue: webhooken capturer Math.round(total * 100), og et avvik
        // gir delvis capture hos Vipps.
        total: amountValue / 100,
        status: "pending",
        paymentProvider: "vipps",
        newsletterOptIn: newsletterOptIn === true,
      },
    });

    const reference = `poynt-${order.id}-${crypto.randomUUID().slice(0, 8)}`;
    await payload.update({
      collection: "orders",
      id: order.id,
      data: { vippsReference: reference },
    });

    const itemCount = products.reduce((sum, p) => sum + p.quantity, 0);
    const description =
      products.length === 1
        ? products[0].product.name.slice(0, 100)
        : `Poynt – ${itemCount} produkter`;

    const payment = await createVippsPayment({
      reference,
      amountValue,
      description,
      returnUrl: `${process.env.NEXT_PUBLIC_URL}/kvittering?ref=${reference}`,
      // Hurtigkasse: kunden deler kontaktinfo i appen i staden for skjema hos oss
      profileScope: "name email phoneNumber",
    });

    return NextResponse.json({ url: payment.redirectUrl });
  } catch (error) {
    // Interne feilmeldinger (Vipps/Payload) skal ikke ut til klienten.
    console.error("Vipps checkout error:", error);
    return NextResponse.json(
      { error: "Noe gikk galt i kassen. Prøv igjen om et øyeblikk." },
      { status: 500 }
    );
  }
}
