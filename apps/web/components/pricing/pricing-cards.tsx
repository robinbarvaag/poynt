"use client";
import { Button } from "@poynt/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@poynt/ui";
import { Switch } from "@poynt/ui";
import { Label } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { useState } from "react";

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency?: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  icon?: IconName;
  gradient?: string;
  ctaText?: string;
}

interface PricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tiers: PricingTier[];
  currentTierId?: string;
  onSelectTier?: (tier: PricingTier, isYearly: boolean) => void;
}

interface TierConfig {
  icon: IconName;
  color: string;
  bgColor: string;
  checkColor: string;
}

const defaultTierConfig: Record<string, TierConfig> = {
  free: {
    icon: "zap",
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-100 dark:bg-slate-800",
    checkColor: "text-slate-500",
  },
  pro: {
    icon: "rocket",
    color: "text-primary",
    bgColor: "bg-primary/10",
    checkColor: "text-primary",
  },
  business: {
    icon: "crown",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    checkColor: "text-amber-600 dark:text-amber-400",
  },
};

function getTierConfig(tierId: string): TierConfig {
  const config = defaultTierConfig[tierId];
  if (config) return config;
  return defaultTierConfig.free as TierConfig;
}

export function PricingDialog({
  open,
  onOpenChange,
  tiers,
  currentTierId,
  onSelectTier,
}: PricingDialogProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-2xl font-bold">
            Velg planen som passer for deg
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Alle planer inkluderer ubegrenset tilgang til AI-verktøyene
          </p>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-4">
          <Label
            htmlFor="billing-toggle-dialog"
            className={cn(
              "text-sm font-medium transition-colors cursor-pointer",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Månedlig
          </Label>
          <Switch
            id="billing-toggle-dialog"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label
            htmlFor="billing-toggle-dialog"
            className={cn(
              "text-sm font-medium transition-colors cursor-pointer",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Årlig
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
              Spar 17%
            </span>
          </Label>
        </div>

        <div className="grid gap-6 md:grid-cols-3 py-4">
          {tiers.map((tier) => {
            const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
            const isCurrentPlan = tier.id === currentTierId;
            const tierConfig = getTierConfig(tier.id);
            const tierIconName = tier.icon ?? tierConfig.icon;

            const isHighlighted = tier.highlighted || tier.id === "pro";

            return (
              <div
                key={tier.id}
                className={cn(
                  "relative rounded-2xl border transition-all duration-300",
                  isHighlighted
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-muted-foreground/30 hover:shadow-md",
                  isCurrentPlan && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {(tier.badge || isHighlighted) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
                      <Icon name="sparkles" className="size-3.5" />
                      {tier.badge || "Mest populær"}
                    </span>
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-2xl p-6 lg:p-8 h-full flex flex-col bg-card",
                    isHighlighted && "pt-8"
                  )}
                >
                  <div className="text-center mb-6">
                    <div
                      className={cn(
                        "inline-flex items-center justify-center size-14 rounded-2xl mb-4",
                        tierConfig.bgColor
                      )}
                    >
                      <Icon
                        name={tierIconName}
                        className={cn("size-7", tierConfig.color)}
                      />
                    </div>
                    <h3 className="text-xl font-bold">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tier.description}
                    </p>
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold tracking-tight">
                        {price === 0 ? "Gratis" : `${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          kr/{isYearly ? "år" : "mnd"}
                        </span>
                      )}
                    </div>
                    {isYearly && tier.monthlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        = {Math.round(tier.yearlyPrice / 12)} kr/mnd
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 flex-1 mb-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Icon
                          name="check"
                          className={cn(
                            "size-5 shrink-0 mt-0.5",
                            tierConfig.checkColor
                          )}
                        />
                        <span className="text-sm text-muted-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className="w-full"
                    variant={
                      isCurrentPlan
                        ? "secondary"
                        : isHighlighted
                          ? "default"
                          : "outline"
                    }
                    size="lg"
                    disabled={isCurrentPlan}
                    onClick={() => onSelectTier?.(tier, isYearly)}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Icon name="check" className="mr-2 size-4" />
                        Nåværende plan
                      </>
                    ) : (
                      tier.ctaText || "Velg plan"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          Alle priser er i NOK ekskl. mva. Du kan når som helst endre eller
          kansellere planen din.
        </p>
      </DialogContent>
    </Dialog>
  );
}

interface PricingCardsProps {
  tiers: PricingTier[];
  currentTierId?: string;
  onSelectTier?: (tier: PricingTier, isYearly: boolean) => void;
  className?: string;
}

export function PricingCards({
  tiers,
  currentTierId,
  onSelectTier,
  className,
}: PricingCardsProps) {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className={cn("space-y-8", className)}>
      <div className="flex items-center justify-center gap-4">
        <Label
          htmlFor="billing-toggle"
          className={cn(
            "text-sm font-medium transition-colors cursor-pointer",
            !isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Månedlig
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label
          htmlFor="billing-toggle"
          className={cn(
            "text-sm font-medium transition-colors cursor-pointer",
            isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Årlig
          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-400">
            Spar 17%
          </span>
        </Label>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => {
          const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
          const isCurrentPlan = tier.id === currentTierId;
          const tierConfig = getTierConfig(tier.id);
          const tierIconName = tier.icon ?? tierConfig.icon;
          const isHighlighted = tier.highlighted || tier.id === "pro";

          return (
            <div
              key={tier.id}
              className={cn(
                "relative rounded-2xl border transition-all duration-300",
                isHighlighted
                  ? "border-primary shadow-lg"
                  : "border-border hover:border-muted-foreground/30 hover:shadow-md",
                isCurrentPlan && "ring-2 ring-primary ring-offset-2"
              )}
            >
              {(tier.badge || isHighlighted) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm">
                    <Icon name="sparkles" className="size-3.5" />
                    {tier.badge || "Mest populær"}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl p-6 lg:p-8 h-full flex flex-col bg-card",
                  isHighlighted && "pt-8"
                )}
              >
                <div className="text-center mb-6">
                  <div
                    className={cn(
                      "inline-flex items-center justify-center size-14 rounded-2xl mb-4",
                      tierConfig.bgColor
                    )}
                  >
                    <Icon
                      name={tierIconName}
                      className={cn("size-7", tierConfig.color)}
                    />
                  </div>
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tier.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold tracking-tight">
                      {price === 0 ? "Gratis" : `${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        kr/{isYearly ? "år" : "mnd"}
                      </span>
                    )}
                  </div>
                  {isYearly && tier.monthlyPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      = {Math.round(tier.yearlyPrice / 12)} kr/mnd
                    </p>
                  )}
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Icon
                        name="check"
                        className={cn(
                          "size-5 shrink-0 mt-0.5",
                          tierConfig.checkColor
                        )}
                      />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={
                    isCurrentPlan
                      ? "secondary"
                      : isHighlighted
                        ? "default"
                        : "outline"
                  }
                  size="lg"
                  disabled={isCurrentPlan}
                  onClick={() => onSelectTier?.(tier, isYearly)}
                >
                  {isCurrentPlan ? (
                    <>
                      <Icon name="check" className="mr-2 size-4" />
                      Nåværende plan
                    </>
                  ) : (
                    tier.ctaText || "Velg plan"
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
