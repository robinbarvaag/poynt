"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

/** localStorage-nøkkel: finnes den, telles ikke besøk fra denne nettleseren. */
export const ANALYTICS_OPT_OUT_KEY = "va-disable";

/**
 * Egne besøk (Robin, Susanne) skal ikke telle i Vercel Analytics.
 * localStorage er per nettleser per enhet, så flagget settes enklest via
 * lenke: `?va=off` skrur av, `?va=on` skrur på igjen. Admin-stripa setter
 * også flagget automatisk når den bekrefter en innlogget Payload-bruker.
 *
 * URL-en leses i selve beforeSend (ikke i en effekt), så første sidevisning
 * fra lenken heller ikke rekker å telle.
 */
const beforeSend: BeforeSend = (event) => {
  try {
    const va = new URLSearchParams(window.location.search).get("va");
    if (va === "off") window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "1");
    if (va === "on") window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) ? null : event;
  } catch {
    // localStorage kan være blokkert (f.eks. enkelte private vinduer).
    return event;
  }
};

export function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
