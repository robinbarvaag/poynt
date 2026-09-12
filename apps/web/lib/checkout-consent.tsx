"use client";

import { createContext, useContext } from "react";

/**
 * Admin-redigerte samtykketekster (Nettbutikk → «Vilkår og angrerett»).
 * Rot-layouten henter dem fra shop-settings og legger dem i konteksten, så
 * alle kjøpsflatene (handlekurv, kurv-skuff, produktside) viser samme tekst.
 * Standardverdiene under speiler defaultValue i globals/shop-settings.ts og
 * brukes bare om globalen ikke kan hentes.
 */
export interface CheckoutConsentTexts {
  checkboxLabel: string;
  dialogTitle: string;
  dialogText: string;
  errorMessage: string;
}

export const DEFAULT_CHECKOUT_CONSENT_TEXTS: CheckoutConsentTexts = {
  checkboxLabel:
    "Jeg ber om at det digitale innholdet leveres umiddelbart, og forstår at angreretten dermed bortfaller. Jeg godtar kjøpsbetingelsene.",
  dialogTitle: "Før du betaler",
  dialogText:
    "Digitalt innhold leveres med en gang betalingen er gjennomført. For at vi skal kunne levere umiddelbart, må du bekrefte at du ber om det og godtar at angreretten bortfaller (angrerettloven § 22 bokstav n).",
  errorMessage: "Du må godta vilkårene før du kan gå videre til betaling.",
};

const CheckoutConsentContext = createContext<CheckoutConsentTexts>(
  DEFAULT_CHECKOUT_CONSENT_TEXTS
);

export function CheckoutConsentProvider({
  texts,
  children,
}: {
  texts: Partial<CheckoutConsentTexts> | null | undefined;
  children: React.ReactNode;
}) {
  const value: CheckoutConsentTexts = {
    checkboxLabel:
      texts?.checkboxLabel || DEFAULT_CHECKOUT_CONSENT_TEXTS.checkboxLabel,
    dialogTitle:
      texts?.dialogTitle || DEFAULT_CHECKOUT_CONSENT_TEXTS.dialogTitle,
    dialogText: texts?.dialogText || DEFAULT_CHECKOUT_CONSENT_TEXTS.dialogText,
    errorMessage:
      texts?.errorMessage || DEFAULT_CHECKOUT_CONSENT_TEXTS.errorMessage,
  };
  return (
    <CheckoutConsentContext.Provider value={value}>
      {children}
    </CheckoutConsentContext.Provider>
  );
}

export function useCheckoutConsentTexts(): CheckoutConsentTexts {
  return useContext(CheckoutConsentContext);
}
