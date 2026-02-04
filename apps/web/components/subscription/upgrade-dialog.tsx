"use client";

import {
  subscriptionFeatures,
  subscriptionPricing,
  subscriptionTierLabels,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import * as React from "react";

type SubscriptionTier = "free" | "pro" | "business";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: SubscriptionTier;
  selectedTier?: SubscriptionTier;
}

export function UpgradeDialog({
  open,
  onOpenChange,
  currentTier,
  selectedTier,
}: UpgradeDialogProps) {
  const [showSuccess, setShowSuccess] = React.useState(false);
  const targetTier =
    selectedTier || (currentTier === "free" ? "pro" : "business");

  const handleContactUs = () => {
    setShowSuccess(true);
  };

  const handleClose = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Icon
                name="check"
                className="size-8 text-green-600 dark:text-green-400"
              />
            </div>
            <DialogTitle className="text-center">
              Takk for din interesse!
            </DialogTitle>
            <DialogDescription className="text-center">
              Vi har mottatt din forespørsel om å oppgradere til{" "}
              <span className="font-medium text-foreground">
                {subscriptionTierLabels[targetTier]}
              </span>
              . Vi tar kontakt innen 24 timer.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="text-muted-foreground">
              Du kan også kontakte oss direkte på:
            </p>
            <a
              href="mailto:hei@markedspilot.no"
              className="mt-1 flex items-center gap-2 font-medium text-primary hover:underline"
            >
              <Icon name="mail" className="size-4" />
              hei@markedspilot.no
            </a>
          </div>
          <DialogFooter>
            <Button onClick={handleClose} className="w-full">
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Oppgrader til {subscriptionTierLabels[targetTier]}
          </DialogTitle>
          <DialogDescription>
            Få tilgang til flere funksjoner og bedrifter med en oppgradert plan.
          </DialogDescription>
        </DialogHeader>

        {/* Plan comparison */}
        <div className="grid gap-4 py-4">
          {/* Current plan */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nåværende plan</p>
                <p className="font-medium">
                  {subscriptionTierLabels[currentTier]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {subscriptionPricing[currentTier].monthly} kr
                </p>
                <p className="text-xs text-muted-foreground">/måned</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {subscriptionFeatures[currentTier]
                .slice(0, 3)
                .map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon
                      name="check"
                      className="size-3.5 text-muted-foreground"
                    />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <Icon
              name="arrow-right"
              className="size-6 text-muted-foreground rotate-90"
            />
          </div>

          {/* Target plan */}
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="size-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Oppgrader til</p>
                  <p className="font-medium">
                    {subscriptionTierLabels[targetTier]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {subscriptionPricing[targetTier].monthly} kr
                </p>
                <p className="text-xs text-muted-foreground">/måned</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1">
              {subscriptionFeatures[targetTier].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Icon name="check" className="size-3.5 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact info */}
        <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Manuell oppgradering:</strong> For å endre abonnementet
            ditt, ta kontakt med oss så hjelper vi deg.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleContactUs}>
            <Icon name="mail" className="mr-2 size-4" />
            Kontakt oss for å oppgradere
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
