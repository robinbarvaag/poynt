"use client";

import { CheckoutConsentCheckbox } from "@/components/checkout-consent-checkbox";
import { VippsButton } from "@/components/vipps-button";
import { useCheckoutConsentTexts } from "@/lib/checkout-consent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@poynt/ui";
import { useState } from "react";

/**
 * Bekreftelsesvindu for Vipps-hurtigkasse der det ikke er plass til
 * samtykkeboksen ved knappen (produktside, kurv-skuff): første klikk på
 * Vipps åpner vinduet, kunden huker av, og den offisielle Vipps-knappen
 * inne i vinduet starter betalingen. Samme boks, samme tekst som i
 * handlekurven — bare flyttet inn i en modal.
 */
export function CheckoutConsentDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kalles når kunden har huket av og trykker Vipps-knappen. */
  onConfirm: () => void;
  loading?: boolean;
  /** Feil fra kassen (f.eks. utsolgt) vises i vinduet. */
  error?: string | null;
}) {
  const texts = useCheckoutConsentTexts();
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Nullstill ved lukking: samtykket skal gis på nytt hver gang.
      setAccepted(false);
      setShowError(false);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-3xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            {texts.dialogTitle}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {texts.dialogText}
          </DialogDescription>
        </DialogHeader>

        <CheckoutConsentCheckbox
          checked={accepted}
          onCheckedChange={(value) => {
            setAccepted(value);
            if (value) setShowError(false);
          }}
          error={showError}
          className="rounded-2xl bg-muted/50 p-4"
        />

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
          >
            {error}
          </p>
        )}

        {/* Offisiell Vipps-knapp — retningslinjene tillater ikke egen design. */}
        <VippsButton
          stretched
          loading={loading}
          onClick={() => {
            if (!accepted) {
              setShowError(true);
              return;
            }
            onConfirm();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
