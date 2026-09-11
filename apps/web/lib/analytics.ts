import { hasAnalyticsConsent } from "./consent";

/**
 * Tynt lag over Google Analytics 4 (gtag).
 *
 * Hendelser sendes KUN når brukeren har samtykket til statistikk. Uten
 * samtykke er dette en no-op — ingenting lastes, ingenting køes.
 *
 * Vi pusher på dataLayer med et `arguments`-objekt (ikke array) — det er
 * formatet gtag.js forventer, og køen tømmes når scriptet er lastet. Dermed
 * kan `purchase` fyres selv om gtag.js ennå ikke har rukket å laste.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
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

function pushArguments(..._args: unknown[]): void {
  // biome-ignore lint/style/noArguments: gtag.js krever et ekte `arguments`-objekt
  window.dataLayer?.push(arguments);
}

export function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  pushArguments.apply(null, args);
}

export function trackEvent(name: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  gtag("event", name, params);
}
