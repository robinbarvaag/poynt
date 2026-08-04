import config from "@/payload.config";
import { subscribeToNewsletter } from "@poynt/email";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

/**
 * Nyhetsbrev-påmelding fra kvitteringssiden (Vipps-hurtigkassen). Tar kun en
 * ordre-referanse — e-posten hentes fra ordren på serveren, så adressen aldri
 * eksponeres for klienten. Samtykket dokumenteres med newsletterOptIn på ordren.
 */
export async function POST(req: NextRequest) {
  const { getClientIp, rateLimit } = await import("@/lib/rate-limit");
  const ip = getClientIp(req.headers);
  if (!rateLimit("order-opt-in", ip, { limit: 10, windowMs: 10 * 60_000 })) {
    return NextResponse.json(
      { error: "For mange forsøk. Vent litt og prøv igjen." },
      { status: 429 }
    );
  }

  try {
    const { reference } = await req.json();
    if (typeof reference !== "string" || !reference.startsWith("poynt-")) {
      return NextResponse.json({ error: "Ugyldig referanse" }, { status: 400 });
    }

    const payload = await getPayload({ config });
    const orders = await payload.find({
      collection: "orders",
      where: { vippsReference: { equals: reference } },
      limit: 1,
      depth: 0,
    });
    const order = orders.docs[0];

    // Kun betalte ordrer med kjent e-post kan meldes på. Er webhooken ikke
    // ferdig ennå, får kunden «prøv igjen»-melding i UI-et.
    if (!order || order.status !== "paid" || !order.customerEmail) {
      return NextResponse.json(
        { error: "Ordren er ikke klar ennå" },
        { status: 409 }
      );
    }

    if (!order.newsletterOptIn) {
      const result = await subscribeToNewsletter(order.customerEmail);
      if (!result.success) {
        console.error("Nyhetsbrev-påmelding feilet:", result.error);
        return NextResponse.json(
          { error: "Påmeldingen feilet" },
          { status: 500 }
        );
      }

      await payload.update({
        collection: "orders",
        id: order.id,
        data: { newsletterOptIn: true },
      });
    }

    return NextResponse.json({ subscribed: true });
  } catch (error) {
    console.error("Order opt-in error:", error);
    return NextResponse.json({ error: "Noe gikk galt" }, { status: 500 });
  }
}
