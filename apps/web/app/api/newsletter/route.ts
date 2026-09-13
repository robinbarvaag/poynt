import { NEWSLETTER_CONSENT_TEXTS } from "@/lib/newsletter-consent-texts";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(request.headers);
  if (!rateLimit("newsletter", ip, { limit: 5, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Prøv igjen om noen minutter." },
      { status: 429 }
    );
  }

  try {
    const body = (await request.json()) as { email?: unknown; path?: unknown };
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { error: "E-postadresse er påkrevd" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Ugyldig e-postadresse" },
        { status: 400 }
      );
    }

    const { subscribeWithConsent } = await import("@/lib/newsletter-consent");
    const result = await subscribeWithConsent({
      email,
      source: "newsletter-form",
      consentText: NEWSLETTER_CONSENT_TEXTS.newsletterForm,
      path: typeof body.path === "string" ? body.path : undefined,
    });

    if (!result.success) {
      console.error("Newsletter subscription failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Kunne ikke registrere e-postadressen" },
        { status: 500 }
      );
    }

    // Internt varsel sendes fra subscribeWithConsent.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "En feil oppstod. Prøv igjen senere." },
      { status: 500 }
    );
  }
}
