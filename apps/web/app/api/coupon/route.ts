import { resolveCoupon } from "@/lib/coupon";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Validerer en rabattkode (delt logikk i lib/coupon.ts) og returnerer
 * rabatt-typen (prosent eller kronebeløp) så handlekurven kan vise den
 * rabatterte summen. Selve rabatten påføres på nytt — og er fasit — i
 * kassene (`/api/checkout` og `/api/vipps/checkout`); dette er kun for UI-et.
 */
export async function POST(req: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(req.headers);
  if (!rateLimit("coupon", ip, { limit: 10, windowMs: 60_000 })) {
    return NextResponse.json(
      { valid: false, error: "For mange forsøk. Vent litt og prøv igjen." },
      { status: 429 }
    );
  }

  try {
    const { code, subtotal } = (await req.json()) as {
      code?: string;
      subtotal?: number;
    };

    const subtotalKr = Math.max(0, Number(subtotal) || 0);
    const result = await resolveCoupon(code ?? "", subtotalKr);

    if (!result.ok) {
      return NextResponse.json({ valid: false, error: result.error });
    }

    return NextResponse.json({
      valid: true,
      code: result.coupon.code,
      percentOff: result.coupon.percentOff,
      amountOffKr: result.coupon.amountOffKr,
      label: result.coupon.label,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Kunne ikke sjekke koden akkurat nå" },
      { status: 500 }
    );
  }
}
