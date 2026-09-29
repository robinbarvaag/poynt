import type { CartItem } from "@poynt/cart";
import { track as vercelTrack } from "@vercel/analytics";
import { hasAnalyticsConsent, hasMarketingConsent } from "./consent";

/**
 * Tynt lag over Vercel Web Analytics, Google Analytics 4 (gtag) og Meta Pixel
 * (fbq). Én `trackEvent()` → alle tre.
 *
 * Vercel: cookieløs og uten persondata, så den får ALLE hendelser uten
 * samtykke (samme grunnlag som sidevisningene). Pro-planen tillater bare
 * 2 egenskaper per hendelse, og ingen nøstede objekter — derfor plukker
 * VERCEL_PROPS ut de to viktigste per hendelse. Egne besøk filtreres bort av
 * beforeSend i SiteAnalytics (gjelder også hendelser).
 *
 * GA/Meta sendes KUN når brukeren har samtykket til den aktuelle kategorien
 * (statistikk for GA, markedsføring for Meta). Uten samtykke er de en no-op —
 * ingenting lastes, ingenting køes. GA får alle parametrene (funnels bygges
 * der, under Utforsk → «Traktutforskning»).
 *
 * Aldri send persondata (e-post, navn) som parametre.
 *
 * GA: Vi pusher på dataLayer med et `arguments`-objekt (ikke array) — det er
 * formatet gtag.js forventer, og køen tømmes når scriptet er lastet. Dermed
 * kan `purchase` fyres selv om gtag.js ennå ikke har rukket å laste.
 *
 * Meta: `fbq`-stubben (med kø) opprettes av MetaPixel-komponenten når
 * markedsføring er godtatt. Er den ikke der, finnes det ikke samtykke.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

export type GaItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_variant?: string;
};

type EventParams = Record<string, unknown>;

/** Handlekurv-linjer → GA4 `items`. */
export function toGaItems(items: CartItem[]): GaItem[] {
  return items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    item_variant: item.variantValue,
  }));
}

/**
 * Hendelsene vi sporer. Navnene følger GA4-konvensjonen (snake_case, og
 * GA4s anbefalte navn der de finnes: add_to_cart, begin_checkout, purchase).
 */
export type TrackedEvent =
  /** Legg i handlekurv. */
  | "add_to_cart"
  /** Klikk på «Til betaling» (kort eller Vipps). */
  | "begin_checkout"
  /** Fullført kjøp (kvitteringssiden). */
  | "purchase"
  /** Innsendt CMS-skjema (kontakt, venteliste, søknad …). */
  | "form_submit"
  /** Påmelding til nyhetsbrevet. */
  | "newsletter_signup"
  /** Påmelding til event. */
  | "event_signup"
  /** Låst opp boksider med ordrenummer. */
  | "book_unlock"
  /** Klikk på knapp-lenke til en annen side på nettstedet. */
  | "cta_click"
  /** Klikk på lenke til et annet nettsted (bokhandel, Spotify …). */
  | "outbound_click"
  /** Klikk på e-post- eller telefonlenke. */
  | "contact_click";

/**
 * De (maks) to parametrene som sendes til Vercel per hendelse — Pro-planens
 * grense. Rekkefølgen er prioritet.
 */
const VERCEL_PROPS: Record<TrackedEvent, readonly string[]> = {
  add_to_cart: ["item_name", "value"],
  begin_checkout: ["method", "value"],
  purchase: ["value", "currency"],
  form_submit: ["form", "source"],
  newsletter_signup: ["source"],
  event_signup: ["status", "party_size"],
  book_unlock: ["store"],
  cta_click: ["label", "href"],
  outbound_click: ["host", "label"],
  contact_click: ["method"],
};

/** GA4-navn → Meta standardhendelse. Mangler = sendes ikke til Meta. */
const META_EVENT_NAMES: Partial<Record<TrackedEvent, string>> = {
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  form_submit: "Lead",
  newsletter_signup: "Lead",
  event_signup: "CompleteRegistration",
  contact_click: "Contact",
};

type VercelValue = string | number | boolean | null;

/** Vercel tar bare flate verdier, maks 255 tegn. */
function toVercelProps(
  name: TrackedEvent,
  params: EventParams
): Record<string, VercelValue> {
  // Produktnavn ligger i items[] (GA-format) — løft det første opp.
  const items = Array.isArray(params.items) ? (params.items as GaItem[]) : [];
  const flat: EventParams = { item_name: items[0]?.item_name, ...params };
  const out: Record<string, VercelValue> = {};
  for (const key of VERCEL_PROPS[name]) {
    const value = flat[key];
    if (typeof value === "string") out[key] = value.slice(0, 255);
    else if (typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

function pushArguments(..._args: unknown[]): void {
  // biome-ignore lint/style/noArguments: gtag.js krever et ekte `arguments`-objekt
  window.dataLayer?.push(arguments);
}

export function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  pushArguments.apply(null, args);
}

export function fbq(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.fbq?.(...args);
}

/**
 * Oversetter GA4-parametre til Meta-format. Meta bruker `content_ids` /
 * `contents` i stedet for `items`, og `value`/`currency` er felles.
 */
function toMetaParams(params: EventParams): EventParams {
  const { items, transaction_id, ...rest } = params;
  const out: EventParams = { ...rest };
  if (Array.isArray(items)) {
    const list = items as GaItem[];
    out.content_type = "product";
    out.content_ids = list.map((i) => i.item_id);
    out.contents = list.map((i) => ({
      id: i.item_id,
      quantity: i.quantity ?? 1,
      item_price: i.price,
    }));
  }
  if (typeof transaction_id === "string") {
    out.order_id = transaction_id;
  }
  return out;
}

export function trackEvent(name: TrackedEvent, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(name, toVercelProps(name, params));
  } catch {
    // Sporing skal aldri knekke et klikk eller en innsending.
  }
  if (hasAnalyticsConsent()) {
    gtag("event", name, params);
  }
  const metaName = META_EVENT_NAMES[name];
  if (metaName && hasMarketingConsent()) {
    const opts =
      typeof params.transaction_id === "string"
        ? { eventID: params.transaction_id }
        : undefined;
    fbq("track", metaName, toMetaParams(params), opts);
  }
}
