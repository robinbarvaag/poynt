import { getStripe } from '@poynt/stripe';

/**
 * Membership pricing configuration for all billing periods.
 * Amounts are in NOK øre (smallest currency unit). 99900 = 999 NOK.
 *
 * Pricing structure:
 * - 1 month: 999 NOK/month (base rate)
 * - 3 months: 899 NOK/month (10% savings)
 * - 6 months: 849 NOK/month (15% savings)
 * - 12 months: 799 NOK/month (20% savings)
 */
export const MEMBERSHIP_PRICING = [
  { months: 1, amount: 99900, label: '1 måned', monthlyRate: 999 },
  { months: 3, amount: 269700, label: '3 måneder', monthlyRate: 899 },
  { months: 6, amount: 509400, label: '6 måneder', monthlyRate: 849 },
  { months: 12, amount: 959400, label: '12 måneder', monthlyRate: 799 },
] as const;

/**
 * Create Stripe Prices for all membership billing periods.
 *
 * This is a ONE-TIME setup script, not called on every request.
 * Run this manually or via deployment script to seed Stripe with the 4 membership prices.
 *
 * Each Price is created with:
 * - recurring.interval = 'month'
 * - recurring.interval_count = billing period (1, 3, 6, or 12)
 * - metadata containing tier and billing period info for webhook processing
 *
 * @param productId - Stripe Product ID for the membership product
 * @param tier - Membership tier ('community' or 'community_ai')
 * @returns Array of created Stripe Price objects
 *
 * @example
 * ```ts
 * // Run once during setup
 * const prices = await createMembershipPrices('prod_ABC123', 'community');
 * console.log('Created price IDs:', prices.map(p => p.id));
 * ```
 */
export async function createMembershipPrices(
  productId: string,
  tier: 'community' | 'community_ai' = 'community'
) {
  const stripe = getStripe();

  const prices = await Promise.all(
    MEMBERSHIP_PRICING.map(({ months, amount, label }) =>
      stripe.prices.create({
        product: productId,
        currency: 'nok',
        unit_amount: amount,
        recurring: {
          interval: 'month',
          interval_count: months,
        },
        metadata: {
          tier: tier,
          billingPeriodMonths: months.toString(),
          billingPeriodLabel: label,
        },
      })
    )
  );

  return prices;
}
