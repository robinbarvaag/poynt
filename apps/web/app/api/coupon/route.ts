import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Validerer en rabattkode mot Stripe sine Promotion Codes og returnerer
 * rabatt-typen (prosent eller kronebeløp) så handlekurven kan vise den
 * rabatterte summen. Selve rabatten påføres på nytt — og er fasit — i
 * checkout-sesjonen (`/api/checkout`); dette er kun for UI-et.
 */
export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = (await req.json()) as {
      code?: string;
      subtotal?: number;
    };

    const trimmed = code?.trim();
    if (!trimmed) {
      return NextResponse.json(
        { valid: false, error: "Skriv inn en rabattkode" },
        { status: 400 }
      );
    }

    // Promotion codes er den kundevendte koden (f.eks. SOMMER25); coupon er
    // selve rabatten den peker på. Vi slår opp på aktive koder.
    const promos = await stripe.promotionCodes.list({
      code: trimmed,
      active: true,
      limit: 1,
    });
    const promo = promos.data[0];

    if (!promo || !promo.coupon.valid) {
      return NextResponse.json({
        valid: false,
        error: "Ugyldig eller utløpt kode",
      });
    }

    const { coupon } = promo;
    const subtotalKr = Math.max(0, Number(subtotal) || 0);

    // Kronebeløp-koder må være i samme valuta som butikken (NOK).
    if (coupon.amount_off && coupon.currency && coupon.currency !== "nok") {
      return NextResponse.json({
        valid: false,
        error: "Koden gjelder en annen valuta",
      });
    }

    // Minstebeløp på koden (lagret i øre hos Stripe).
    const minimum = promo.restrictions?.minimum_amount;
    if (minimum != null && subtotalKr * 100 < minimum) {
      return NextResponse.json({
        valid: false,
        error: `Koden krever et kjøp på minst ${Math.round(minimum / 100)} kr`,
      });
    }

    const percentOff = coupon.percent_off ?? null;
    const amountOffKr =
      coupon.amount_off != null ? coupon.amount_off / 100 : null;

    return NextResponse.json({
      valid: true,
      code: promo.code,
      percentOff,
      amountOffKr,
      label: percentOff ? `${percentOff} % rabatt` : `${amountOffKr} kr rabatt`,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Kunne ikke sjekke koden akkurat nå" },
      { status: 500 }
    );
  }
}
