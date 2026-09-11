import { hasAnalyticsConsent, hasMarketingConsent } from "./consent";

/**
 * Tynt lag over Google Analytics 4 (gtag) og Meta Pixel (fbq).
 *
 * Hendelser sendes KUN når brukeren har samtykket til den aktuelle
 * kategorien (statistikk for GA, markedsføring for Meta). Uten samtykke er
 * dette en no-op — ingenting lastes, ingenting køes.
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

/** Hendelsesnavn vi støtter i begge systemer. GA4-navn er nøkkel. */
export type TrackedEvent = "add_to_cart" | "purchase";

/** GA4-navn → Meta standardhendelse. */
const META_EVENT_NAMES: Record<TrackedEvent, string> = {
  add_to_cart: "AddToCart",
  purchase: "Purchase",
};

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
  if (hasAnalyticsConsent()) {
    gtag("event", name, params);
  }
  if (hasMarketingConsent()) {
    const opts =
      typeof params.transaction_id === "string"
        ? { eventID: params.transaction_id }
        : undefined;
    fbq("track", META_EVENT_NAMES[name], toMetaParams(params), opts);
  }
}
