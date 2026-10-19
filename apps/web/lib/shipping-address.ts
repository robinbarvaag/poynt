/**
 * Leveringsadresse for fysiske varer. Kunden fyller den inn i handlekurven
 * før betaling (begge kassene), serveren validerer med `parseShippingAddress`
 * og lagrer den på ordren (`orders.shipping`). Ingen tunge importer her —
 * fila deles av klient (skjemaet) og server (kassene + webhookene).
 */
export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2. Vi sender bare innenlands. */
  country: "NO";
  phone: string;
}

/** Feltene kunden fyller inn (alt tekst, før validering). */
export type ShippingAddressInput = {
  name: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  phone: string;
};

export const EMPTY_SHIPPING_INPUT: ShippingAddressInput = {
  name: "",
  line1: "",
  line2: "",
  postalCode: "",
  city: "",
  phone: "",
};

export type ShippingField = keyof ShippingAddressInput;

export type ShippingErrors = Partial<Record<ShippingField, string>>;

/** Feilmeldingen kassene svarer med når adressen mangler eller er ugyldig. */
export const SHIPPING_REQUIRED_ERROR =
  "Fyll inn leveringsadressen før du betaler.";

const MAX_LEN = 120;

const str = (value: unknown): string =>
  typeof value === "string" ? value.trim().slice(0, MAX_LEN) : "";

/** Norsk mobil/fastnummer: 8 sifre, valgfritt +47 / 0047 foran. */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s().-]/g, "");
  const match = /^(?:\+47|0047)?(\d{8})$/.exec(digits);
  return match ? match[1] : null;
}

/**
 * Valider det kunden skrev. Returnerer feil per felt (til skjemaet) eller en
 * ferdig normalisert adresse. Brukes identisk på klient og server, så det
 * kunden ser som grønt aldri avvises av kassen.
 */
export function validateShippingInput(
  input: Partial<ShippingAddressInput> | null | undefined
):
  | { ok: true; address: ShippingAddress }
  | { ok: false; errors: ShippingErrors } {
  const name = str(input?.name);
  const line1 = str(input?.line1);
  const line2 = str(input?.line2);
  const postalCode = str(input?.postalCode).replace(/\s/g, "");
  const city = str(input?.city);
  const phoneRaw = str(input?.phone);

  const errors: ShippingErrors = {};
  if (!name) errors.name = "Skriv inn navnet på mottakeren.";
  if (!line1) errors.line1 = "Skriv inn gateadressen.";
  if (!/^\d{4}$/.test(postalCode)) {
    errors.postalCode = "Postnummeret må være fire sifre.";
  }
  if (!city) errors.city = "Skriv inn poststedet.";
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  if (!phone) {
    errors.phone = phoneRaw
      ? "Skriv inn et norsk telefonnummer med åtte sifre."
      : "Skriv inn telefonnummeret (for sporing og levering).";
  }

  if (Object.keys(errors).length > 0 || !phone) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    address: {
      name,
      line1,
      ...(line2 && { line2 }),
      postalCode,
      city,
      country: "NO",
      phone,
    },
  };
}

/**
 * Stripe-kassen oppretter ordren først i webhooken, så adressen reiser som
 * metadata på Checkout-sesjonen (maks 500 tegn per verdi — godt innenfor).
 */
export function shippingToStripeMetadata(
  address: ShippingAddress
): Record<string, string> {
  return {
    ship_name: address.name,
    ship_line1: address.line1,
    ...(address.line2 && { ship_line2: address.line2 }),
    ship_postal: address.postalCode,
    ship_city: address.city,
    ship_country: address.country,
    ship_phone: address.phone,
  };
}

export function shippingFromStripeMetadata(
  metadata: Record<string, string> | null | undefined
): ShippingAddress | null {
  if (!metadata?.ship_line1) return null;
  const result = validateShippingInput({
    name: metadata.ship_name ?? "",
    line1: metadata.ship_line1,
    line2: metadata.ship_line2 ?? "",
    postalCode: metadata.ship_postal ?? "",
    city: metadata.ship_city ?? "",
    phone: metadata.ship_phone ?? "",
  });
  return result.ok ? result.address : null;
}

/**
 * Adressen slik Payload lagrer den (alle felt valgfrie) → den strenge typen
 * e-postene bruker. Null når gata mangler, dvs. ordren ble lagt uten adresse.
 */
export function shippingFromStored(
  stored:
    | {
        name?: string | null;
        line1?: string | null;
        line2?: string | null;
        postalCode?: string | null;
        city?: string | null;
        country?: string | null;
        phone?: string | null;
      }
    | null
    | undefined
): ShippingAddress | null {
  if (!stored?.line1) return null;
  return {
    name: stored.name ?? "",
    line1: stored.line1,
    ...(stored.line2 && { line2: stored.line2 }),
    postalCode: stored.postalCode ?? "",
    city: stored.city ?? "",
    country: "NO",
    phone: stored.phone ?? "",
  };
}
