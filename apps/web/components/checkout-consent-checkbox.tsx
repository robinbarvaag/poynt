"use client";

import { useCheckoutConsentTexts } from "@/lib/checkout-consent";
import { Checkbox } from "@poynt/ui";
import Link from "next/link";
import { useId } from "react";

/**
 * Det aktive samtykket angrerettloven § 22 bokstav n krever før kjøp av
 * digitalt innhold som leveres umiddelbart: kunden må selv huke av for at
 * leveringen skal starte med en gang, og at angreretten dermed bortfaller.
 * Aldri forhåndsutfylt. Teksten redigeres i admin (Nettbutikk → Vilkår og
 * angrerett); lenkene til kjøpsbetingelser og personvern legges til her.
 */
export function CheckoutConsentCheckbox({
  checked,
  onCheckedChange,
  error,
  className = "",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Vis feilmelding (kunden prøvde å betale uten å huke av). */
  error?: boolean;
  className?: string;
}) {
  const texts = useCheckoutConsentTexts();
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          size="sm"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          aria-invalid={error || undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5"
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-foreground text-sm leading-relaxed"
        >
          {texts.checkboxLabel}{" "}
          <span className="text-muted-foreground">
            (
            <Link
              href="/kjopsbetingelser"
              target="_blank"
              className="underline underline-offset-2 hover:text-foreground"
            >
              kjøpsbetingelser
            </Link>
            {" · "}
            <Link
              href="/personvern"
              target="_blank"
              className="underline underline-offset-2 hover:text-foreground"
            >
              personvern
            </Link>
            )
          </span>
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-destructive text-sm">
          {texts.errorMessage}
        </p>
      )}
    </div>
  );
}
