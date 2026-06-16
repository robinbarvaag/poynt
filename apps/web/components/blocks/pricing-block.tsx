import { Pricing, type PricingTier } from "@poynt/ui";

interface TierItem {
  name: string;
  price: string;
  period?: string | null;
  description?: string | null;
  features?: { text: string }[] | null;
  ctaText: string;
  ctaUrl: string;
  featured?: boolean | null;
  badge?: string | null;
}

interface PricingBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  tiers?: TierItem[] | null;
}

/** Mapper Payload-blokken `pricing` til Pricing i @poynt/ui. */
export function PricingBlock({
  eyebrow,
  title,
  intro,
  tiers,
}: PricingBlockProps) {
  const mapped: PricingTier[] = (tiers ?? []).map((t) => ({
    name: t.name,
    price: t.price,
    period: t.period ?? undefined,
    description: t.description ?? undefined,
    features: (t.features ?? []).map((f) => f.text),
    cta: { text: t.ctaText, href: t.ctaUrl },
    featured: t.featured ?? undefined,
    badge: t.badge ?? undefined,
  }));
  return (
    <Pricing
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      tiers={mapped}
    />
  );
}
