import { getSessionWithMembership } from "@/lib/membership";
import { createVippsPayment } from "@/lib/vipps";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Hurtigkasse med Vipps: validerer kurven mot databasen, opprettar ein
 * pending-ordre i Payload, og sender kunden til Vipps-landingssida.
 * Kundens navn/e-post hentast via profile sharing i appen — resten skjer i
 * webhooken (/api/webhooks/vipps): capture, ordre → betalt, kvitterings-epost.
 */
export async function POST(req: NextRequest) {
  try {
    const { items, couponCode, newsletterOptIn } = await req.json();

    const authSession = await getSessionWithMembership(req);

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    // Same servervalidering som i Stripe-checkouten: aldri stol på klientpris.
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

    // Vipps-flyten støttar ikkje gjentakande betaling — medlemskap må via kort.
    if (products.some((p) => p.product.type === "membership")) {
      return NextResponse.json(
        { error: "Medlemskap må kjøpast med kort" },
        { status: 400 }
      );
    }

    let total = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

    // Rabattkodane bur i Stripe — vi løyser koden der og reknar rabatten
    // sjølv, så same kode verkar uavhengig av betalingsmåte.
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
      if (promo.coupon.percent_off) {
        total = total * (1 - promo.coupon.percent_off / 100);
      } else if (promo.coupon.amount_off) {
        total = Math.max(0, total - promo.coupon.amount_off / 100);
      }
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
        total: Math.round(total),
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
    console.error("Vipps checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Noko gjekk gale" },
      { status: 500 }
    );
  }
}
