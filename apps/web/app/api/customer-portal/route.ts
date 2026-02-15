import config from "@/payload.config";
import { auth } from "@poynt/planner-auth/server";
import { getStripe } from "@poynt/stripe";
import { getPayload } from "payload";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Get authenticated session
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await getPayload({ config });

    // Find user by email to get stripeCustomerId
    const result = await payload.find({
      collection: "users",
      where: { email: { equals: session.user.email } },
      limit: 1,
    });

    if (result.docs.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.docs[0];

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "Ingen Stripe-kundekonto funnet" },
        { status: 400 }
      );
    }

    // Create billing portal session
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId as string,
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
