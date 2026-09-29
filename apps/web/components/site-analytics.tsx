"use client";

import { trackEvent } from "@/lib/analytics";
import { Analytics, type BeforeSend } from "@vercel/analytics/next";
import { useEffect } from "react";

/** localStorage-nøkkel: finnes den, telles ikke besøk fra denne nettleseren. */
export const ANALYTICS_OPT_OUT_KEY = "va-disable";

/**
 * Egne besøk (Robin, Susanne) skal ikke telle i Vercel Analytics.
 * localStorage er per nettleser per enhet, så flagget settes enklest via
 * lenke: `?va=off` skrur av, `?va=on` skrur på igjen. Admin-stripa setter
 * også flagget automatisk når den bekrefter en innlogget Payload-bruker.
 *
 * URL-en leses i selve beforeSend (ikke i en effekt), så første sidevisning
 * fra lenken heller ikke rekker å telle. Gjelder både sidevisninger og
 * egne hendelser (track).
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

/** Synlig tekst på lenka, komprimert — det er den som vises i rapportene. */
function linkLabel(link: HTMLAnchorElement): string {
  const text = link.getAttribute("aria-label") || link.textContent || "";
  return text.replace(/\s+/g, " ").trim().slice(0, 100);
}

/**
 * Global klikksporing via delegering, så ingen blokk trenger egen kode:
 * - e-post/telefon-lenker → `contact_click`
 * - lenker til andre nettsteder (bokhandler, Spotify …) → `outbound_click`
 * - interne lenker som ser ut som knapper (`<Button asChild>` gir
 *   data-slot="button") → `cta_click`
 *
 * `data-track="navn"` på en lenke gjør den til en CTA med det navnet;
 * `data-no-track` på en lenke eller forelder slår sporingen av.
 */
function handleLinkClick(event: MouseEvent) {
  // Bare venstre- og midtklikk (midtklikk = «åpne i ny fane»).
  if (event.type === "auxclick" && event.button !== 1) return;
  const target = event.target instanceof Element ? event.target : null;
  const link = target?.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.closest("[data-no-track]")) return;

  const href = link.getAttribute("href") ?? "";
  if (href.startsWith("mailto:")) {
    trackEvent("contact_click", { method: "email" });
    return;
  }
  if (href.startsWith("tel:")) {
    trackEvent("contact_click", { method: "phone" });
    return;
  }

  let url: URL;
  try {
    url = new URL(link.href);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  const label = linkLabel(link);
  if (url.host !== window.location.host) {
    trackEvent("outbound_click", {
      host: url.host.replace(/^www\./, ""),
      label,
      url: url.href,
    });
    return;
  }
  if (link.dataset.track || link.dataset.slot === "button") {
    trackEvent("cta_click", {
      label: link.dataset.track || label,
      href: url.pathname + url.hash,
    });
  }
}

export function SiteAnalytics() {
  useEffect(() => {
    // Capture-fase: fanger klikket selv om en komponent stopper propageringen.
    document.addEventListener("click", handleLinkClick, true);
    document.addEventListener("auxclick", handleLinkClick, true);
    return () => {
      document.removeEventListener("click", handleLinkClick, true);
      document.removeEventListener("auxclick", handleLinkClick, true);
    };
  }, []);

  return <Analytics beforeSend={beforeSend} />;
}
