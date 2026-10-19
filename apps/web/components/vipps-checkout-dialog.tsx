"use client";

import { CheckoutConsentCheckbox } from "@/components/checkout-consent-checkbox";
import { ShippingAddressForm } from "@/components/shipping-address-form";
import { VippsButton } from "@/components/vipps-button";
import { useCheckoutConsentTexts } from "@/lib/checkout-consent";
import {
  EMPTY_SHIPPING_INPUT,
  type ShippingAddress,
  type ShippingAddressInput,
  type ShippingErrors,
  validateShippingInput,
} from "@/lib/shipping-address";
import {
  readStoredShipping,
  writeStoredShipping,
} from "@/lib/shipping-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@poynt/ui";
import { useEffect, useState } from "react";

/** Det kunden bekreftet i vinduet — sendes videre til Vipps-kassen. */
export interface VippsCheckoutConfirmation {
  termsAccepted: boolean;
  shipping?: ShippingAddress;
}

/**
 * «Før du betaler»-vinduet for Vipps-hurtigkasse der det ikke er plass til
 * stegene ved knappen (produktside, kurv-skuff). Første klikk på Vipps åpner
 * vinduet, og den offisielle Vipps-knappen inne i vinduet starter betalingen.
 * Det er fortsatt én Vipps-flyt: vinduet samler bare det loven og frakten
 * krever rett før betalingen, i stedet for å sende kunden til handlekurven.
 *
 * Steg (vises bare når de trengs):
 * - leveringsadresse (varer med frakt) — samme skjema og validering som i
 *   handlekurven, adressen huskes i sessionStorage
 * - samtykke til umiddelbar levering (angrerettloven § 22 n)
 * - beskjed om at handlekurven ligger urørt («Kjøp nå» kjøper bare denne
 *   varen), med snarvei til å kjøpe alt samlet i stedet
 */
export function VippsCheckoutDialog({
  open,
  onOpenChange,
  needsConsent = false,
  needsShipping = false,
  otherItemsCount = 0,
  onBuyTogether,
  onConfirm,
  loading = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kurven/varen leveres umiddelbart — samtykkeboksen må hukes av. */
  needsConsent?: boolean;
  /** Kurven/varen krever frakt — adresseskjemaet må fylles ut. */
  needsShipping?: boolean;
  /** Antall andre linjer i handlekurven som IKKE er med i dette kjøpet
      («Kjøp nå» fra produktsiden). 0 = ingen beskjed. */
  otherItemsCount?: number;
  /** Snarvei fra beskjeden over: legg varen i kurven og gå til handlekurven. */
  onBuyTogether?: () => void;
  /** Kalles når alle stegene er i orden og kunden trykker Vipps-knappen. */
  onConfirm: (confirmation: VippsCheckoutConfirmation) => void;
  loading?: boolean;
  /** Feil fra kassen (f.eks. utsolgt) vises i vinduet. */
  error?: string | null;
}) {
  const texts = useCheckoutConsentTexts();
  const [accepted, setAccepted] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [shippingInput, setShippingInput] =
    useState<ShippingAddressInput>(EMPTY_SHIPPING_INPUT);
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({});

  // Adressen hentes når vinduet åpnes — ikke ved første render, der serveren
  // ikke har noen sessionStorage.
  useEffect(() => {
    if (open && needsShipping) setShippingInput(readStoredShipping());
  }, [open, needsShipping]);

  const updateShipping = (next: ShippingAddressInput) => {
    setShippingInput(next);
    writeStoredShipping(next);
    // Fjern feilen på feltet kunden retter, la de andre stå.
    setShippingErrors((errors) => {
      const cleared: ShippingErrors = { ...errors };
      for (const key of Object.keys(errors) as (keyof ShippingErrors)[]) {
        if (next[key] !== shippingInput[key]) delete cleared[key];
      }
      return cleared;
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Nullstill ved lukking: samtykket skal gis på nytt hver gang.
      // Adressen beholdes (sessionStorage) — den er ikke et samtykke.
      setAccepted(false);
      setShowConsentError(false);
      setShippingErrors({});
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    if (needsConsent && !accepted) {
      setShowConsentError(true);
      return;
    }
    let shipping: ShippingAddress | undefined;
    if (needsShipping) {
      const result = validateShippingInput(shippingInput);
      if (!result.ok) {
        setShippingErrors(result.errors);
        return;
      }
      shipping = result.address;
    }
    onConfirm({ termsAccepted: needsConsent && accepted, shipping });
  };

  const description = needsConsent
    ? texts.dialogText
    : needsShipping
      ? "Varen sendes i posten, så vi trenger leveringsadressen din før du betaler."
      : "Vipps-knappen under tar deg rett til betaling for denne varen.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Med adresseskjema kan vinduet bli høyere enn en liten mobilskjerm —
          la innholdet scrolle i stedet for å havne utenfor. */}
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            {texts.dialogTitle}
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        {needsShipping && (
          <ShippingAddressForm
            className="rounded-2xl bg-muted/50 p-4"
            value={shippingInput}
            errors={shippingErrors}
            onChange={updateShipping}
          />
        )}

        {needsConsent && (
          <CheckoutConsentCheckbox
            checked={accepted}
            onCheckedChange={(value) => {
              setAccepted(value);
              if (value) setShowConsentError(false);
            }}
            error={showConsentError}
            className="rounded-2xl bg-muted/50 p-4"
          />
        )}

        {otherItemsCount > 0 && (
          <p className="rounded-2xl bg-accent-3/30 px-4 py-3 text-sm leading-relaxed">
            Du kjøper bare denne varen nå.{" "}
            {otherItemsCount === 1
              ? "Varen som ligger i handlekurven"
              : `De ${otherItemsCount} varene i handlekurven`}{" "}
            blir liggende der til senere.
            {onBuyTogether && (
              <>
                {" "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2 hover:text-primary"
                  onClick={onBuyTogether}
                >
                  Vil du heller kjøpe alt samlet?
                </button>
              </>
            )}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-destructive/10 px-3 py-2 text-destructive text-sm"
          >
            {error}
          </p>
        )}

        {/* Offisiell Vipps-knapp — retningslinjene tillater ikke egen design. */}
        <VippsButton stretched loading={loading} onClick={handleConfirm} />
      </DialogContent>
    </Dialog>
  );
}
