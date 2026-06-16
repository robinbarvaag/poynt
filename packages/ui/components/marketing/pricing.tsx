import { cn } from "../../lib/utils";
import { Button } from "../button";
import { Container } from "../container";
import { Reveal } from "../motion";
import { Heading, Text } from "../typography";

export interface PricingTier {
  name: string;
  /** Pris som tall-tekst, f.eks. "0", "99", "199". */
  price: string;
  /** Enhet etter prisen, f.eks. "kr/mnd". */
  period?: string;
  description?: string;
  features: string[];
  cta: { text: string; href: string };
  /** Fremhev denne planen (anbefalt). */
  featured?: boolean;
  /** Liten merkelapp, f.eks. "Mest populær". */
  badge?: string;
}

export interface PricingProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  tiers: PricingTier[];
}

/**
 * Pris-/medlemskapsblokk. Kort per plan, med én fremhevet anbefaling. Funksjoner
 * markeres med en tynn strek (ingen ikoner). Innholds-only.
 */
export function Pricing({ eyebrow, title, intro, tiers }: PricingProps) {
  return (
    <Container padding="none">
      {(eyebrow || title || intro) && (
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            {eyebrow && (
              <span className="font-heading font-semibold text-primary text-sm uppercase tracking-[0.2em]">
                {eyebrow}
              </span>
            )}
            {title && (
              <Heading
                variant="h2"
                color="foreground"
                align="center"
                customStyles="mt-3"
              >
                {title}
              </Heading>
            )}
            {intro && (
              <Text variant="lead" align="center" customStyles="mt-4">
                {intro}
              </Text>
            )}
          </div>
        </Reveal>
      )}

      <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => {
          const { featured } = tier;
          const muted = featured
            ? "text-primary-foreground/75"
            : "text-muted-foreground";
          const marker = featured ? "bg-saffron" : "bg-primary";
          return (
            <Reveal key={tier.name} className="h-full">
              <div
                className={cn(
                  "flex h-full flex-col rounded-3xl p-8",
                  featured
                    ? "bg-primary text-primary-foreground shadow-xl ring-1 ring-primary/20 lg:-translate-y-2"
                    : "border border-border bg-card text-card-foreground"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading font-bold text-xl">
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 font-semibold text-xs",
                        featured
                          ? "bg-saffron text-foreground"
                          : "bg-accent text-accent-foreground"
                      )}
                    >
                      {tier.badge}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-bold font-heading text-5xl leading-none tracking-tight">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className={cn("text-sm", muted)}>{tier.period}</span>
                  )}
                </div>

                {tier.description && (
                  <p className={cn("mt-4 text-sm leading-relaxed", muted)}>
                    {tier.description}
                  </p>
                )}

                <ul className="mt-8 flex flex-col gap-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-2.5 h-px w-4 shrink-0 rounded-full",
                          marker
                        )}
                      />
                      <span className={cn("text-sm leading-relaxed", muted)}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  variant={featured ? "saffron" : "default"}
                  className="mt-10 w-full"
                >
                  <a href={tier.cta.href}>{tier.cta.text}</a>
                </Button>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Container>
  );
}
