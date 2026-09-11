"use client";

import { gtag } from "@/lib/analytics";
import { useEffect, useRef } from "react";
import { useConsent } from "./consent-provider";

interface Props {
  /** GA4 målings-ID, f.eks. G-XXXXXXXXXX. Tom = ingenting lastes. */
  gaId?: string;
}

/**
 * Laster Google Analytics 4 — kun etter samtykke til statistikk.
 *
 * Google Consent Mode v2 («basic»): consent-standard settes til «denied» før
 * gtag.js lastes, og oppdateres til «granted» i det brukeren godtar. Trekkes
 * samtykket tilbake, slås GA av og _ga-cookiene slettes.
 *
 * Sidevisninger ved klientnavigasjon fanges av GA4s «Enhanced measurement»
 * (history changes), så vi sender ikke page_view manuelt.
 */
export function GoogleAnalytics({ gaId }: Props) {
  const { consent } = useConsent();
  const loadedRef = useRef(false);
  const granted = consent?.categories.analytics === true;

  useEffect(() => {
    if (!gaId) return;

    if (granted) {
      // Ikke tillatt å slå på igjen? ga-disable-flagget må av først.
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] =
        false;

      if (!loadedRef.current) {
        loadedRef.current = true;
        // Rekkefølge er viktig: consent default → js → config → så scriptet.
        gtag("consent", "default", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
          wait_for_update: 500,
        });
        gtag("consent", "update", { analytics_storage: "granted" });
        gtag("js", new Date());
        gtag("config", gaId, { anonymize_ip: true });

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
        document.head.appendChild(script);
      } else {
        gtag("consent", "update", { analytics_storage: "granted" });
      }
      return;
    }

    // Avslått (eller trukket tilbake) etter at GA var lastet: skru av og rydd.
    if (loadedRef.current) {
      gtag("consent", "update", { analytics_storage: "denied" });
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] =
        true;
      deleteGaCookies();
    }
  }, [gaId, granted]);

  return null;
}

function deleteGaCookies() {
  const host = window.location.hostname;
  // Slett både på eksakt host og på rotdomenet (GA setter på rotdomenet).
  const domains = [host, `.${host}`];
  const parts = host.split(".");
  if (parts.length > 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
  }
  for (const part of document.cookie.split("; ")) {
    const name = part.split("=")[0];
    if (name === "_ga" || name.startsWith("_ga_") || name === "_gid") {
      for (const domain of domains) {
        document.cookie = `${name}=; Path=/; Domain=${domain}; Max-Age=0`;
      }
      document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
  }
}
