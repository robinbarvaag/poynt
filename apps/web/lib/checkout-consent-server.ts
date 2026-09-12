import type { Payload } from "payload";
import { DEFAULT_CHECKOUT_CONSENT_TEXTS } from "./checkout-consent";

/** Feilmeldingen kassene svarer med når samtykket mangler. */
export const CONSENT_REQUIRED_ERROR =
  "Du må godta vilkårene for kjøp av digitalt innhold før du kan betale.";

/**
 * Hva som lagres på ordren som dokumentasjon på samtykket (angrerettloven
 * § 22 n): at boksen ble huket av, når, og hvilken tekst kunden så. Teksten
 * hentes fra shop-settings på serveren — klienten kan ikke sende inn sin egen.
 */
export interface ConsentSnapshot {
  termsAccepted: true;
  termsAcceptedAt: string;
  termsAcceptedText: string;
}

export async function snapshotConsent(
  payload: Payload,
  acceptedAt: Date = new Date()
): Promise<ConsentSnapshot> {
  let text = DEFAULT_CHECKOUT_CONSENT_TEXTS.checkboxLabel;
  try {
    const shop = await payload.findGlobal({ slug: "shop-settings", depth: 0 });
    if (shop?.consentCheckboxLabel) text = shop.consentCheckboxLabel;
  } catch (error) {
    console.error("Klarte ikke hente samtykketekst fra shop-settings:", error);
  }
  return {
    termsAccepted: true,
    termsAcceptedAt: acceptedAt.toISOString(),
    termsAcceptedText: text,
  };
}
