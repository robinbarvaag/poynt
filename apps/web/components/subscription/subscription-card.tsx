"use client";

import {
  subscriptionPricing,
  subscriptionTierLabels,
  subscriptionTierLimits,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@poynt/ui";
import { Progress } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import * as React from "react";

interface SubscriptionCardProps {
  subscription: {
    tier: "free" | "pro" | "business";
    status: string;
    currentPeriodEnd?: string | null;
  };
  usage: {
    workspaces: {
      current: number;
      limit: number;
    };
  };
  onUpgrade?: () => void;
  onManage?: () => void;
  className?: string;
}

export function SubscriptionCard({
  subscription,
  usage,
  onUpgrade,
  onManage,
  className,
}: SubscriptionCardProps) {
  const { tier, status, currentPeriodEnd } = subscription;
  const limits = subscriptionTierLimits[tier];
  const pricing = subscriptionPricing[tier];
  const isUnlimited = limits.maxWorkspaces === -1;
  const usagePercent = isUnlimited
    ? 0
    : (usage.workspaces.current / usage.workspaces.limit) * 100;

  const tierIcon: Record<"free" | "pro" | "business", IconName> = {
    free: "credit-card",
    pro: "sparkles",
    business: "building",
  };

  const tierIconName = tierIcon[tier];

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                tier === "free" && "bg-muted",
                tier === "pro" && "bg-primary/10",
                tier === "business" && "bg-amber-500/10"
              )}
            >
              <Icon
                name={tierIconName}
                className={cn(
                  "size-5",
                  tier === "free" && "text-muted-foreground",
                  tier === "pro" && "text-primary",
                  tier === "business" && "text-amber-600"
                )}
              />
            </div>
            <div>
              <CardTitle className="text-lg">
                {subscriptionTierLabels[tier]}
              </CardTitle>
              <CardDescription>
                {pricing.monthly === 0
                  ? "Gratis for alltid"
                  : `${pricing.monthly} kr/mnd`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                status === "active" &&
                  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                status === "trialing" &&
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                status === "canceled" &&
                  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                status === "past_due" &&
                  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              )}
            >
              {status === "active" && "Aktiv"}
              {status === "trialing" && "Prøveperiode"}
              {status === "canceled" && "Kansellert"}
              {status === "past_due" && "Forfalt"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="building" className="size-4" />
              <span>Bedrifter</span>
            </div>
            <span className="font-medium">
              {usage.workspaces.current} /{" "}
              {isUnlimited ? "∞" : usage.workspaces.limit}
            </span>
          </div>
          {!isUnlimited && <Progress value={usagePercent} className="h-2" />}
          {isUnlimited && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Ubegrenset bedrifter inkludert i din plan
            </div>
          )}
        </div>

        {/* Period info */}
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

        {/* Actions */}
        <div className="flex gap-3">
          {tier !== "business" && (
            <Button onClick={onUpgrade} className="flex-1">
              <Icon name="sparkles" className="mr-2 size-4" />
              Oppgrader
            </Button>
          )}
          {tier !== "free" && (
            <Button variant="outline" onClick={onManage} className="flex-1">
              Administrer
            </Button>
          )}
          {tier === "business" && (
            <Button variant="outline" onClick={onManage} className="flex-1">
              Administrer abonnement
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
