import { stripe } from "@poynt/stripe";

/**
 * ÉN kilde til sannhet for rabattkoder. Kodene bor i Stripe (Promotion Codes,
 * partner lager dem i dashboardet), men fordi vi har to betalingsveier —
 * Stripe-kassen (Stripe regner selv) og Vipps (vi regner) — må all validering
 * og utregning skje her, så begge kassene og /api/coupon oppfører seg likt.
 */

export interface ResolvedCoupon {
  /** Promotion code-id — sendes som `discounts` til Stripe-checkout. */
  promoId: string;
  code: string;
  percentOff: number | null;
  amountOffKr: number | null;
  label: string;
}

export type CouponResult =
  | { ok: true; coupon: ResolvedCoupon }
  | { ok: false; error: string };

/** Slå opp og valider en rabattkode mot Stripe, gitt delsummen i kr. */
export async function resolveCoupon(
  code: string,
  subtotalKr: number
): Promise<CouponResult> {
  const trimmed = code.trim();
  if (!trimmed) {
    return { ok: false, error: "Skriv inn en rabattkode" };
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
    return { ok: false, error: "Ugyldig eller utløpt kode" };
  }

  const { coupon } = promo;

  // Kronebeløp-koder må være i samme valuta som butikken (NOK).
  if (coupon.amount_off && coupon.currency && coupon.currency !== "nok") {
    return { ok: false, error: "Koden gjelder en annen valuta" };
  }

  // Minstebeløp på koden (lagret i øre hos Stripe).
  const minimum = promo.restrictions?.minimum_amount;
  if (minimum != null && subtotalKr * 100 < minimum) {
    return {
      ok: false,
      error: `Koden krever et kjøp på minst ${Math.round(minimum / 100)} kr`,
    };
  }

  const percentOff = coupon.percent_off ?? null;
  const amountOffKr =
    coupon.amount_off != null ? coupon.amount_off / 100 : null;

  return {
    ok: true,
    coupon: {
      promoId: promo.id,
      code: promo.code,
      percentOff,
      amountOffKr,
      label: percentOff ? `${percentOff} % rabatt` : `${amountOffKr} kr rabatt`,
    },
  };
}

/** Delsum → rabattert totalsum i kr (aldri negativ). */
export function discountedTotal(
  subtotalKr: number,
  coupon: ResolvedCoupon
): number {
  if (coupon.percentOff != null) {
    return subtotalKr * (1 - coupon.percentOff / 100);
  }
  if (coupon.amountOffKr != null) {
    return Math.max(0, subtotalKr - coupon.amountOffKr);
  }
  return subtotalKr;
}
