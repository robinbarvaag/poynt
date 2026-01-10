import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";
import { stripe } from "@poynt/stripe";
import { sendOrderConfirmation } from "@poynt/email";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Mangler Stripe signatur" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET er ikkje satt");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handter checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const payload = await getPayload({ config });

      // Hent line items frå Stripe
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { expand: ["data.price.product"] }
      );

      // Finn produkt i databasen basert på Stripe Price ID
      const orderItems = await Promise.all(
        lineItems.data.map(async (item) => {
          const priceId =
            typeof item.price === "string" ? item.price : item.price?.id;

          const products = await payload.find({
            collection: "products",
            where: {
              stripePriceId: {
                equals: priceId,
              },
            },
            limit: 1,
          });

          if (products.docs.length === 0) {
            throw new Error(`Fann ikkje produkt med Price ID: ${priceId}`);
          }

          const product = products.docs[0];

          return {
            product: product.id,
            priceAtPurchase: product.price,
          };
        })
      );

      // Opprett ordre
      const order = await payload.create({
        collection: "orders",
        data: {
          user: session.metadata?.userId || "",
          items: orderItems,
          total: session.amount_total || 0,
          status: "paid",
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      // Send bekreftelsesmail
      if (session.customer_email) {
        await sendOrderConfirmation(
          session.customer_email,
          order.id,
          session.amount_total || 0
        );
      }

      console.log("Ordre oppretta:", order.id);
    } catch (error) {
      console.error("Feil ved oppretting av ordre:", error);
      return NextResponse.json(
        { error: "Feil ved oppretting av ordre" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
