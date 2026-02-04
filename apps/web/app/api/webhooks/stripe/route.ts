import { canonicalizeEmail } from "@/lib/email-normalize";
import config from "@/payload.config";
import { sendOrderConfirmation, sendWelcomeEmail } from "@poynt/email";
import { db, eq } from "@poynt/planner-db";
import { plannerUser, plannerWebhookEvent } from "@poynt/planner-db/schema";
import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type Stripe from "stripe";

// Valid membership tiers from Payload schema
type MembershipTier = "none" | "community" | "community_ai";

/**
 * Handle membership purchases from Stripe checkout.
 * Creates Better Auth user (if needed) and Payload user with membership tier.
 */
async function handleMembershipPurchase(session: Stripe.Checkout.Session) {
  const email = session.customer_email;
  if (!email) throw new Error("No customer email in checkout session");

  const canonical = canonicalizeEmail(email);
  const tierFromMeta = session.metadata?.tier;
  const tier: MembershipTier =
    tierFromMeta === "community" || tierFromMeta === "community_ai"
      ? tierFromMeta
      : "community";
  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id || null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id || null;

  // 1. Check if Better Auth user exists by canonical email
  const existingUser = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.canonicalEmail, canonical))
    .limit(1);

  let isNewUser = false;

  if (existingUser.length === 0) {
    // 2. Create Better Auth user (just-in-time provisioning)
    isNewUser = true;
    const userId = crypto.randomUUID();
    await db.insert(plannerUser).values({
      id: userId,
      name: session.customer_details?.name || email.split("@")[0],
      email: email,
      canonicalEmail: canonical,
      emailVerified: true, // Stripe verified via payment
      role: "user",
    });
  }

  // 3. Create or update Payload user with membership
  const payload = await getPayload({ config });

  const existingPayloadUsers = await payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existingPayloadUsers.docs.length > 0) {
    // Update existing Payload user
    await payload.update({
      collection: "users",
      id: existingPayloadUsers.docs[0].id,
      data: {
        membershipTier: tier,
        membershipStatus: "active",
        stripeCustomerId: stripeCustomerId || undefined,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
      },
    });
  } else {
    // Create new Payload user (no password - they'll use magic link or Google)
    // Payload requires a password for auth collections, so generate a random one
    // The user will never use it (magic link / Google login only)
    await payload.create({
      collection: "users",
      data: {
        email: email,
        password: crypto.randomUUID(), // Random password, unused
        firstName: session.customer_details?.name?.split(" ")[0] || "",
        lastName:
          session.customer_details?.name?.split(" ").slice(1).join(" ") || "",
        role: "customer",
        membershipTier: tier,
        membershipStatus: "active",
        stripeCustomerId: stripeCustomerId || undefined,
        stripeSubscriptionId: stripeSubscriptionId || undefined,
      },
    });
  }

  // 4. Send welcome email for new users
  if (isNewUser) {
    // Generate login URL for first login
    // The welcome email directs them to the login page where they can use
    // Google or request a magic link
    const loginUrl = `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/innlogging`;
    await sendWelcomeEmail(email, loginUrl);
  }
}

/**
 * Handle product purchases from Stripe checkout.
 * Creates order in Payload and sends confirmation email.
 */
async function handleProductPurchase(session: Stripe.Checkout.Session) {
  const payload = await getPayload({ config });

  // Hent line items frå Stripe
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

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
  const userId = session.metadata?.userId;
  if (!userId) {
    throw new Error("Mangler userId i session metadata");
  }

  const order = await payload.create({
    collection: "orders",
    draft: false,
    data: {
      user: Number.parseInt(userId, 10),
      items: orderItems,
      total: session.amount_total || 0,
      status: "paid",
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
    },
  });

  // Send bekreftelsesmail
  if (session.customer_email) {
    await sendOrderConfirmation(session.customer_email, String(order.id));
  }

  console.log("Ordre oppretta:", order.id);
}

export async function POST(req: NextRequest) {
  console.log("Mottatt Stripe webhook");
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

  // Check idempotency - has this event already been processed?
  const existingEvent = await db
    .select()
    .from(plannerWebhookEvent)
    .where(eq(plannerWebhookEvent.eventId, event.id))
    .limit(1);

  if (existingEvent.length > 0) {
    console.log(`Webhook event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true });
  }

  // Handter checkout.session.completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      // Route based on product type
      if (session.metadata?.productType === "membership") {
        await handleMembershipPurchase(session);
      } else {
        // Default to product purchase
        await handleProductPurchase(session);
      }

      // Record successful processing
      await db.insert(plannerWebhookEvent).values({
        id: crypto.randomUUID(),
        eventId: event.id,
        type: event.type,
      });
    } catch (error) {
      console.error("Feil ved behandling av webhook:", error);
      return NextResponse.json(
        { error: "Feil ved behandling av webhook" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
