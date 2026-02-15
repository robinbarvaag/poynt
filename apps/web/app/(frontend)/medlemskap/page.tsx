'use client';

import { MEMBERSHIP_PRICING } from '@/src/lib/stripe/create-membership-prices';
import { Button } from '@poynt/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@poynt/ui/components/card';
import { Check } from 'lucide-react';
import { useState } from 'react';

// Environment variables for Stripe Price IDs
// These should be set after running createMembershipPrices utility
const PRICE_IDS = {
  1: process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_1M || '',
  3: process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_3M || '',
  6: process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_6M || '',
  12: process.env.NEXT_PUBLIC_MEMBERSHIP_PRICE_12M || '',
} as const;

/**
 * Membership pricing page at /medlemskap
 *
 * Displays 4 billing period options with Norwegian copy.
 * User selects a period and clicks "Bli medlem" to redirect to Stripe Checkout.
 */
export default function MedlemskapPage() {
  const [selectedMonths, setSelectedMonths] = useState(12); // Default: best value (12 months)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPricing = MEMBERSHIP_PRICING.find(
    (p) => p.months === selectedMonths
  );

  const handleCheckout = async () => {
    if (!selectedPricing) return;

    const priceId = PRICE_IDS[selectedMonths as keyof typeof PRICE_IDS];

    if (!priceId) {
      setError(
        'Medlemskapspriser er ikke konfigurert. Kontakt support for hjelp.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          tier: 'community', // For now, only offering community tier
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Noko gjekk gale');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Ingen checkout URL returnert');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(
        err instanceof Error ? err.message : 'Noko gjekk gale ved checkout'
      );
      setIsLoading(false);
    }
  };

  // Calculate savings percentage compared to 1-month plan
  const baseMonthlyCost = MEMBERSHIP_PRICING[0].monthlyRate;
  const calculateSavings = (monthlyRate: number) => {
    if (monthlyRate >= baseMonthlyCost) return 0;
    return Math.round(((baseMonthlyCost - monthlyRate) / baseMonthlyCost) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Bli medlem av On Poynt
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Få tilgang til praktiske markedsføringsverktøy, AI-assistanse og et
            community av markedsførere. Velg en betalingsperiode som passer deg.
          </p>
        </div>

        {/* Pricing Selector */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {MEMBERSHIP_PRICING.map((pricing) => {
            const savings = calculateSavings(pricing.monthlyRate);
            const isSelected = selectedMonths === pricing.months;

            return (
              <Card
                key={pricing.months}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-blue-600 border-2 shadow-lg'
                    : 'border-slate-200'
                }`}
                onClick={() => setSelectedMonths(pricing.months)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{pricing.label}</CardTitle>
                    {savings > 0 && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                        Spar {savings}%
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-slate-900">
                        {pricing.monthlyRate} kr
                      </div>
                      <div className="text-sm text-slate-600">per måned</div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        Totalpris:{' '}
                        <span className="font-semibold text-slate-900">
                          {(pricing.amount / 100).toLocaleString('nb-NO')} kr
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Betales {pricing.months === 1 ? 'månedlig' : `hver ${pricing.months}. måned`}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center text-sm font-medium text-blue-600">
                        <Check className="h-4 w-4 mr-1" />
                        Valgt
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
            className="px-8 py-6 text-lg"
          >
            {isLoading ? 'Laster...' : 'Bli medlem'}
          </Button>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <p className="mt-4 text-sm text-slate-600">
            Du blir omdirigert til sikker betaling med Stripe
          </p>
        </div>

        {/* Features List */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Hva får du som medlem?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureItem
              title="Markedsføringsverktøy"
              description="AI-drevne verktøy for markedsplanlegging, innholdsplanlegging og strategiutvikling"
            />
            <FeatureItem
              title="Eksklusive guider"
              description="Tilgang til omfattende ressurser om markedsføring på LinkedIn, TikTok, e-post og mer"
            />
            <FeatureItem
              title="Community-tilgang"
              description="Del erfaringer og lær av andre markedsførere i vårt community"
            />
            <FeatureItem
              title="Regelmessige oppdateringer"
              description="Nye verktøy, funksjoner og innhold legges til kontinuerlig"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <Check className="h-6 w-6 text-white" />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </div>
  );
}
