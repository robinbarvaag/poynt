import type { Product } from "@/payload-types";
import type Stripe from "stripe";

/**
 * Leveringsadresse for fysiske varer. Begge kassene lar betalingsleverandøren
 * samle inn adressen (Stripe: `shipping_address_collection`, Vipps: profile
 * sharing-scope `address`), og webhookene normaliserer svaret hit før det
 * lagres på ordren (`orders.shipping`).
 */
export interface ShippingAddress {
  name?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2, f.eks. «NO». */
  country: string;
  phone?: string;
}

/**
 * Kurven trenger leveringsadresse når minst ett produkt er merket «Krever
 * frakt» i admin. Avgjøres på serveren ut fra produktene, aldri av klienten.
 */
export function cartNeedsShipping(
  lines: { product: Pick<Product, "requiresShipping"> }[]
): boolean {
  return lines.some((line) => line.product.requiresShipping === true);
}

/** Land vi sender til. Stripe viser bare disse i adresseskjemaet. */
export const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["NO"];

const clean = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

/**
 * Stripe flyttet leveringsadressen fra `session.shipping_details` til
 * `session.collected_information.shipping_details` i API-versjon 2025-01-27.
 * Vi leser begge, så webhooken tåler eldre sesjoner og en eventuell nedgradering.
 */
export function shippingFromStripeSession(
  session: Stripe.Checkout.Session
): ShippingAddress | null {
  type Details = {
    name?: string | null;
    address?: {
      line1?: string | null;
      line2?: string | null;
      postal_code?: string | null;
      city?: string | null;
      state?: string | null;
      country?: string | null;
    } | null;
  } | null;

  const loose = session as unknown as {
    collected_information?: { shipping_details?: Details } | null;
    shipping_details?: Details;
  };
  const details =
    loose.collected_information?.shipping_details ?? loose.shipping_details;
  const address = details?.address;
  if (!address) return null;

  const line1 = clean(address.line1);
  const postalCode = clean(address.postal_code);
  const city = clean(address.city);
  const country = clean(address.country);
  if (!line1 || !postalCode || !city || !country) return null;

  return {
    name: clean(details?.name) ?? clean(session.customer_details?.name),
    line1,
    line2: clean(address.line2),
    postalCode,
    city,
    country: country.toUpperCase(),
    phone: clean(session.customer_details?.phone),
  };
}

/**
 * Adressen fra Vipps userinfo (`address`-scopet). Vipps gir kundens
 * registrerte adresse — `street_address` kan ha flere linjer, og `formatted`
 * er hele adressen som én streng.
 * Docs: developer.vippsmobilepay.com/docs/APIs/userinfo-api/
 */
export interface VippsUserinfoAddress {
  address_type?: string;
  country?: string;
  formatted?: string;
  postal_code?: string;
  region?: string;
  street_address?: string;
}

export function shippingFromVippsUserinfo(
  userinfo: {
    name?: string;
    phone_number?: string;
    address?: VippsUserinfoAddress | null;
    other_addresses?: VippsUserinfoAddress[] | null;
  } | null,
  fallback?: { name?: string; phone?: string }
): ShippingAddress | null {
  if (!userinfo) return null;
  const candidates = [
    userinfo.address,
    ...(userinfo.other_addresses ?? []),
  ].filter((a): a is VippsUserinfoAddress => !!a);
  // Hjemmeadressen først; ellers første komplette adresse.
  candidates.sort(
    (a, b) =>
      (a.address_type === "home" ? 0 : 1) - (b.address_type === "home" ? 0 : 1)
  );

  for (const address of candidates) {
    const streetLines = (address.street_address ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const line1 = streetLines[0];
    const postalCode = clean(address.postal_code);
    const city = clean(address.region);
    const country = clean(address.country);
    if (!line1 || !postalCode || !city || !country) continue;

    return {
      name: clean(fallback?.name) ?? clean(userinfo.name),
      line1,
      line2:
        streetLines.length > 1 ? streetLines.slice(1).join(", ") : undefined,
      postalCode,
      city,
      country: country.toUpperCase(),
      phone: clean(fallback?.phone) ?? clean(userinfo.phone_number),
    };
  }
  return null;
}
