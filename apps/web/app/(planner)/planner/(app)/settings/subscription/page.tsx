"use client";
import { Icon } from "@poynt/ui/icons";
import { Button } from "@poynt/ui";
import { Progress } from "@poynt/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { trpc } from "@/lib/planner/trpc";
import {
  subscriptionTiers,
  subscriptionTierLabels,
  subscriptionPricing,
  subscriptionFeatures,
  subscriptionTierLimits,
} from "@poynt/planner-validators";
import { PricingDialog, type PricingTier } from "@/components/pricing/pricing-cards";
import { UpgradeDialog } from "@/components/subscription/upgrade-dialog";
import { cn } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { useEffect, useState } from "react";
import { tierConfig } from "@/lib/constants";

type SubscriptionTierType = "free" | "pro" | "business";

interface SubscriptionStatus {
  tier: SubscriptionTierType;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  usage: {
    workspaces: {
      current: number;
      limit: number;
      canCreate: boolean;
    };
  };
}

export default function SubscriptionPage() {
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTierType | undefined>();

  useEffect(() => {
    trpc.workspace.getSubscriptionStatus
      .query()
      .then((status) => {
        setSubscriptionStatus(status as SubscriptionStatus);
      })
      .catch((error) => {
        console.error("Failed to load subscription status:", error);
        toast.error("Kunne ikke laste abonnementsinformasjon");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const pricingTiers: PricingTier[] = subscriptionTiers.map((tier) => ({
    id: tier,
    name: subscriptionTierLabels[tier],
    description:
      tier === "free"
        ? "Perfekt for å komme i gang"
        : tier === "pro"
          ? "For frilansere med flere kunder"
          : "For byråer og større team",
    monthlyPrice: subscriptionPricing[tier].monthly,
    yearlyPrice: subscriptionPricing[tier].yearly,
    features: subscriptionFeatures[tier],
    highlighted: tier === "pro",
    badge: tier === "pro" ? "Mest populær" : undefined,
  }));

  const handleSelectTier = (tier: PricingTier) => {
    if (tier.id === subscriptionStatus?.tier) return;
    setSelectedTier(tier.id as SubscriptionTierType);
    setPricingDialogOpen(false);
    setUpgradeDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Icon name="loader" className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscriptionStatus) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-muted-foreground">
          Kunne ikke laste abonnementsinformasjon. Prøv igjen senere.
        </p>
      </div>
    );
  }

  const { tier, status, currentPeriodEnd, usage } = subscriptionStatus;
  const config = tierConfig[tier];
  const limits = subscriptionTierLimits[tier];
  const pricing = subscriptionPricing[tier];
  const isUnlimited = limits.maxWorkspaces === -1;
  const usagePercent = isUnlimited
    ? 0
    : (usage.workspaces.current / usage.workspaces.limit) * 100;

  return (
    <div className="mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Abonnement</h1>
        <p className="text-muted-foreground">
          Administrer planen din og se bruksstatistikk.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex items-center justify-center size-14 rounded-xl",
                config.bgColor
              )}>
                <Icon name={config.icon} className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{subscriptionTierLabels[tier]}</h2>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      status === "active" && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                      status === "trialing" && "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                      status === "canceled" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                      status === "past_due" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    {status === "active" && "Aktiv"}
                    {status === "trialing" && "Prøveperiode"}
                    {status === "canceled" && "Kansellert"}
                    {status === "past_due" && "Forfalt"}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {pricing.monthly === 0
                    ? "Gratis for alltid"
                    : `${pricing.monthly} kr/mnd`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="building-2" className="size-4" />
                <span>Bedrifter brukt</span>
              </div>
              <span className="font-semibold">
                {usage.workspaces.current} / {isUnlimited ? "∞" : usage.workspaces.limit}
              </span>
            </div>
            {!isUnlimited && (
              <Progress 
                value={usagePercent} 
                className={cn(
                  "h-3",
                  usagePercent >= 100 && "[&>div]:bg-red-500"
                )} 
              />
            )}
            {isUnlimited && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                ✨ Ubegrenset antall bedrifter inkludert i din plan
              </div>
            )}
            {!isUnlimited && usagePercent >= 80 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Du nærmer deg grensen. Oppgrader for flere bedrifter.
              </p>
            )}
          </div>

          {currentPeriodEnd && tier !== "free" && (
            <div className="rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Neste faktura</span>
                <span className="font-medium">
                  {new Date(currentPeriodEnd).toLocaleDateString("nb-NO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => setPricingDialogOpen(true)}
              variant="outline"
              className="flex-1"
            >
              <Icon name="credit-card" className="mr-2 size-4" />
              Se alle planer
            </Button>
            {tier !== "business" && (
              <Button
                onClick={() => {
                  setSelectedTier(tier === "free" ? "pro" : "business");
                  setUpgradeDialogOpen(true);
                }}
                className="flex-1"
              >
                <Icon name="sparkles" className="mr-2 size-4" />
                Oppgrader
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hva er inkludert?</CardTitle>
          <CardDescription>
            Funksjoner i din {subscriptionTierLabels[tier]}-plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {subscriptionFeatures[tier].map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center size-5 rounded-full shrink-0",
                  config.bgColor
                )}>
                  <Icon name="sparkles" className={cn("size-3", config.color)} />
                </div>
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <PricingDialog
        open={pricingDialogOpen}
        onOpenChange={setPricingDialogOpen}
        tiers={pricingTiers}
        currentTierId={tier}
        onSelectTier={handleSelectTier}
      />

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentTier={tier}
        selectedTier={selectedTier}
      />
    </div>
  );
}
