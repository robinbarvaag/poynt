import type { CartItem } from "@poynt/cart";

/** Kassefeil med nok kontekst til at klienten kan rydde kurven. */
export class CheckoutRequestError extends Error {
  /** Produkt-id-er serveren avviste (slettet/utsolgt) — fjernes fra kurven. */
  unavailableIds: string[];

  constructor(message: string, unavailableIds: string[] = []) {
    super(message);
    this.unavailableIds = unavailableIds;
  }
}

/**
 * Start Vipps-hurtigkasse frå klienten: POST kurven til API-et og redirect
 * til Vipps-landingssida. Kastar CheckoutRequestError med norsk melding ved feil.
 * Inneheld kurven digitalt innhald med umiddelbar levering MÅ kallaren ha
 * fått aktivt samtykke (CheckoutConsentCheckbox) først — API-et avviser då
 * kjøp utan `termsAccepted: true`. `termsAccepted` sendast som det er, så
 * serveren (som kjenner produkta) avgjer om det var påkravd.
 */
export async function startVippsCheckout(
  items: CartItem[],
  couponCode?: string,
  newsletterOptIn?: boolean,
  // Aldri utleidd frå kurven her: berre kallaren veit om boksen faktisk vart
  // huka av.
  termsAccepted = false
): Promise<void> {
  await postVippsCheckout(
    items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variant: item.variantValue,
    })),
    termsAccepted,
    couponCode,
    newsletterOptIn
  );
}

/**
 * «Kjøp nå» med Vipps rett frå produktsida: hoppar over handlekurven og
 * sender eitt enkelt produkt til hurtigkassa.
 */
export async function startVippsBuyNow(
  item: {
    id: string;
    quantity: number;
    variant?: string;
  },
  termsAccepted: boolean
): Promise<void> {
  await postVippsCheckout([item], termsAccepted);
}

async function postVippsCheckout(
  items: { id: string; quantity: number; variant?: string }[],
  termsAccepted: boolean,
  couponCode?: string,
  newsletterOptIn?: boolean
): Promise<void> {
  const response = await fetch("/api/vipps/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      couponCode,
      newsletterOptIn: newsletterOptIn === true,
      // Samtykke til bortfall av angrerett (angrerettloven § 22 n) — kravet
      // avgjerast på serveren ut frå produkta i kurven.
      termsAccepted: termsAccepted === true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new CheckoutRequestError(
      data.error || "Noe gikk galt",
      Array.isArray(data.unavailableIds) ? data.unavailableIds : []
    );
  }
  if (!data.url) {
    throw new CheckoutRequestError("Kassen svarte uten betalingslenke");
  }
  window.location.href = data.url;
}
