import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });

    // Hent brukarinfo (krev innlogging)
    const { user } = await payload.auth({ headers: req.headers });

    if (!user) {
      return NextResponse.json(
        { error: "Du må være logga inn" },
        { status: 401 }
      );
    }

    // Valider produkt og prisar mot databasen
    const lineItems = await Promise.all(
      items.map(async (item: { id: string; quantity: number }) => {
        const product = await payload.findByID({
          collection: "products",
          id: item.id,
        });

        if (!product || !product.active) {
          throw new Error(`Produkt ${item.id} er ikkje tilgjengeleg`);
        }

        if (!product.stripePriceId) {
          throw new Error(`Produkt ${item.id} manglar Stripe Price ID`);
        }

        return {
          price: product.stripePriceId,
          quantity: item.quantity,
        };
      })
    );

    // Opprett Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: user.email,
      metadata: {
        userId: user.id,
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
