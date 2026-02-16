import { canonicalizeEmail } from "@/lib/email-normalize";
import config from "@/payload.config";
import {
  getTierFromSubscription,
  mapSubscriptionStatus,
  syncSubscriptionToDrizzle,
  type MembershipTier,
} from "@/src/lib/membership/sync-subscription";
import {
  sendMemberWelcomeEmail,
  sendOrderConfirmation,
  sendWelcomeEmail,
} from "@poynt/email";
import { db, eq } from "@poynt/planner-db";
import { plannerUser, plannerWebhookEvent } from "@poynt/planner-db/schema";
import { stripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import type Stripe from "stripe";

/**
 * Handle membership purchases from Stripe checkout.
 * Creates Better Auth user (if needed) and syncs subscription to Drizzle.
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
      : session.customer?.id || "";
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id || "";

  // 1. Check if Better Auth user exists by canonical email
  const existingUser = await db
    .select()
    .from(plannerUser)
    .where(eq(plannerUser.canonicalEmail, canonical))
    .limit(1);

  if (existingUser.length === 0) {
    // 2. Create Better Auth user (just-in-time provisioning)
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

  // 3. Sync membership to Drizzle
  await syncSubscriptionToDrizzle({
    email,
    tier,
    status: "active",
    stripeCustomerId,
    stripeSubscriptionId,
  });
}

/**
 * Extract customer email from Stripe customer ID.
 */
async function getCustomerEmail(
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer
): Promise<string> {
  const id = typeof customerId === "string" ? customerId : customerId.id;
  const customer = await stripe.customers.retrieve(id);

  if (customer.deleted) {
    throw new Error(`Customer ${id} has been deleted`);
  }

  const email = (customer as Stripe.Customer).email;
  if (!email) {
    throw new Error(`Customer ${id} has no email`);
  }

  return email;
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

/**
 * Handle subscription creation event.
 * Syncs membership to Drizzle and sends welcome email.
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const email = await getCustomerEmail(subscription.customer);
    const tier = getTierFromSubscription(subscription);
    const status = mapSubscriptionStatus(subscription.status);

    await syncSubscriptionToDrizzle({
      email,
      tier,
      status,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // Send welcome email with On Poynt onboarding link
    await sendMemberWelcomeEmail({
      email,
      memberName: email.split("@")[0], // Use email prefix as fallback for name
      tier: tier === "community_ai" ? "Community + AI" : "Community",
    });

    console.log(
      `Subscription created for ${email}: ${tier} (${status}), subscription ${subscription.id}`
    );
  } catch (error) {
    console.error("Error handling subscription.created:", error);
    throw error;
  }
}

/**
 * Handle subscription update event.
 * Syncs updated tier/status to Drizzle.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const email = await getCustomerEmail(subscription.customer);
    const tier = getTierFromSubscription(subscription);
    const status = mapSubscriptionStatus(subscription.status);

    await syncSubscriptionToDrizzle({
      email,
      tier,
      status,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(
      `Subscription updated for ${email}: ${tier} (${status}), cancelAtPeriodEnd=${subscription.cancel_at_period_end}`
    );
  } catch (error) {
    console.error("Error handling subscription.updated:", error);
    throw error;
  }
}

/**
 * Handle subscription deletion event.
 * Sets tier to 'none' and status to 'canceled'.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const email = await getCustomerEmail(subscription.customer);

    await syncSubscriptionToDrizzle({
      email,
      tier: "none",
      status: "canceled",
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Subscription deleted for ${email}, tier set to 'none'`);
  } catch (error) {
    console.error("Error handling subscription.deleted:", error);
    throw error;
  }
}

/**
 * Handle invoice paid event.
 * Re-syncs subscription to confirm active status after renewal.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log("Invoice paid event is not for a subscription, skipping");
      return;
    }

    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;

    // Retrieve full subscription to get current status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const email = await getCustomerEmail(subscription.customer);
    const tier = getTierFromSubscription(subscription);

    // Invoice paid means subscription is active
    await syncSubscriptionToDrizzle({
      email,
      tier,
      status: "active",
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(`Invoice paid for ${email}, subscription ${subscriptionId} confirmed active`);
  } catch (error) {
    console.error("Error handling invoice.paid:", error);
    throw error;
  }
}

/**
 * Handle invoice payment failed event.
 * Sets status to 'past_due'.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log(
        "Invoice payment_failed event is not for a subscription, skipping"
      );
      return;
    }

    const subscriptionId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription.id;

    // Retrieve full subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const email = await getCustomerEmail(subscription.customer);
    const tier = getTierFromSubscription(subscription);

    await syncSubscriptionToDrizzle({
      email,
      tier,
      status: "past_due",
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    console.log(
      `Invoice payment failed for ${email}, subscription ${subscriptionId} marked past_due`
    );
  } catch (error) {
    console.error("Error handling invoice.payment_failed:", error);
    throw error;
  }
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

  // Route event to appropriate handler
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Route based on product type
        if (session.metadata?.productType === "membership") {
          await handleMembershipPurchase(session);
        } else {
          // Default to product purchase
          await handleProductPurchase(session);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Record successful processing
    await db.insert(plannerWebhookEvent).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
    });
  } catch (error) {
    console.error("Feil ved behandling av webhook:", error);
    // Still record the event as processed to prevent retries
    await db.insert(plannerWebhookEvent).values({
      id: crypto.randomUUID(),
      eventId: event.id,
      type: event.type,
    });
    return NextResponse.json(
      { error: "Feil ved behandling av webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
