import { getStripe } from '@poynt/stripe';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/checkout/membership
 *
 * Create a Stripe Checkout Session in subscription mode for membership purchases.
 *
 * CRITICAL: Uses mode='subscription' (not mode='payment') for recurring billing.
 * This is separate from the digital products checkout flow which uses mode='payment'.
 *
 * Request body:
 * - priceId: Stripe Price ID (one of the 4 membership billing periods)
 * - tier: 'community' or 'community_ai'
 * - email: (optional) Pre-fill customer email in checkout
 *
 * The checkout session includes:
 * - metadata.productType = 'membership' (routes to membership webhook handler)
 * - metadata.tier (attached to checkout session for webhook processing)
 * - subscription_data.metadata.tier (attached to Stripe Subscription for lifecycle webhooks)
 *
 * After successful payment, user is redirected to /medlemskap/bekreftelse
 * On cancellation, user returns to /medlemskap
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { priceId, tier, email } = body;

    // Validate required fields
    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json(
        { error: 'priceId er påkrevd' },
        { status: 400 }
      );
    }

    if (!tier || !['community', 'community_ai'].includes(tier)) {
      return NextResponse.json(
        { error: 'Ugyldig medlemskapsnivå' },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // Create Stripe Checkout Session in subscription mode
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // CRITICAL: subscription mode for recurring billing
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Pre-fill email if provided
      ...(email && { customer_email: email }),
      // Metadata for webhook routing
      metadata: {
        productType: 'membership',
        tier: tier,
      },
      // Metadata attached to the Stripe Subscription object for lifecycle webhooks
      subscription_data: {
        metadata: {
          tier: tier,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap/bekreftelse?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/medlemskap`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Membership checkout error:', error);

    // Return user-friendly error for Stripe API issues
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Noko gjekk gale ved oppretting av checkout session' },
      { status: 500 }
    );
  }
}
