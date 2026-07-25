import type { CartItem } from "@poynt/cart";

/**
 * Start Vipps-hurtigkasse frå klienten: POST kurven til API-et og redirect
 * til Vipps-landingssida. Kastar Error med norsk melding ved feil.
 */
export async function startVippsCheckout(
  items: CartItem[],
  couponCode?: string,
  newsletterOptIn?: boolean
): Promise<void> {
  await postVippsCheckout(
    items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      variant: item.variantValue,
    })),
    couponCode,
    newsletterOptIn
  );
}

/**
 * «Kjøp nå» med Vipps rett frå produktsida: hoppar over handlekurven og
 * sender eitt enkelt produkt til hurtigkassa.
 */
export async function startVippsBuyNow(item: {
  id: string;
  quantity: number;
  variant?: string;
}): Promise<void> {
  await postVippsCheckout([item]);
}

async function postVippsCheckout(
  items: { id: string; quantity: number; variant?: string }[],
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
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Noe gikk galt");
  }
  if (data.url) {
    window.location.href = data.url;
  }
}
