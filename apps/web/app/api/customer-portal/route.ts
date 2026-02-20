import { auth } from "@poynt/planner-auth/server";
import { db, eq } from "@poynt/planner-db";
import { plannerSubscription } from "@poynt/planner-db/schema";
import { getStripe } from "@poynt/stripe";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stripeCustomerId from Drizzle subscription
    const subscriptions = await db
      .select()
      .from(plannerSubscription)
      .where(eq(plannerSubscription.userId, session.user.id))
      .limit(1);

    const sub = subscriptions[0];

    if (!sub?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Ingen Stripe-kundekonto funnet" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/innstillinger/medlemskap`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
