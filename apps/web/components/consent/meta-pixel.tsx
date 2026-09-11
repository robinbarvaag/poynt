"use client";

import { useEffect, useRef } from "react";
import { useConsent } from "./consent-provider";

interface Props {
  /** Meta Pixel-ID (tall), f.eks. 1117469773513192. Tom = ingenting lastes. */
  pixelId?: string;
}

/**
 * Laster Meta Pixel (Facebook/Instagram) — kun etter samtykke til
 * markedsføring.
 *
 * Uten samtykke opprettes ikke engang `window.fbq`-stubben, så trackEvent i
 * lib/analytics er en ren no-op. Ved samtykke lages stubben med kø først
 * (så AddToCart/Purchase kan fyres før fbevents.js er lastet), deretter
 * `init` + `PageView` og selve scriptet. Trekkes samtykket tilbake, settes
 * pixelen i «revoke»-modus og _fbp/_fbc-cookiene slettes.
 *
 * Sidevisninger ved klientnavigasjon sendes manuelt via pathname-endring;
 * fbevents.js fanger ikke history-endringer selv.
 */
export function MetaPixel({ pixelId }: Props) {
  const { consent } = useConsent();
  const loadedRef = useRef(false);
  const granted = consent?.categories.marketing === true;

  useEffect(() => {
    if (!pixelId) return;

    if (granted) {
      if (!loadedRef.current) {
        loadedRef.current = true;
        ensureFbqStub();
        window.fbq?.("consent", "grant");
        window.fbq?.("init", pixelId);
        window.fbq?.("track", "PageView");

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);
      } else {
        window.fbq?.("consent", "grant");
      }
      return;
    }

    // Avslått (eller trukket tilbake) etter at pixelen var lastet.
    if (loadedRef.current) {
      window.fbq?.("consent", "revoke");
      deleteMetaCookies();
    }
  }, [pixelId, granted]);

  usePageViewOnNavigation(Boolean(pixelId) && granted);

  return null;
}

/** Sender PageView ved klientnavigasjon (første visning tas av init-flyten). */
function usePageViewOnNavigation(active: boolean) {
  const firstRef = useRef(true);
  useEffect(() => {
    if (!active) return;
    const send = () => {
      if (firstRef.current) {
        firstRef.current = false;
        return;
      }
      window.fbq?.("track", "PageView");
    };
    // Next.js App Router endrer URL via history.pushState — patch én gang.
    const original = history.pushState;
    history.pushState = function pushState(...args) {
      original.apply(this, args);
      send();
    };
    window.addEventListener("popstate", send);
    return () => {
      history.pushState = original;
      window.removeEventListener("popstate", send);
    };
  }, [active]);
}

/**
 * Samme stub som Metas offisielle snippet, bare lesbar: `fbq(...)` køer kall
 * til fbevents.js er lastet og tømmer køen.
 */
function ensureFbqStub() {
  if (window.fbq) return;
  type Fbq = ((...args: unknown[]) => void) & {
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: Fbq;
    loaded: boolean;
    version: string;
  };
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  const fbq: Fbq = Object.assign(
    (...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    },
    { queue: [] as unknown[][], loaded: false, version: "2.0" }
  ) as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  w.fbq = fbq;
  if (!w._fbq) w._fbq = fbq;
}

function deleteMetaCookies() {
  const host = window.location.hostname;
  const domains = [host, `.${host}`];
  const parts = host.split(".");
  if (parts.length > 2) {
    domains.push(`.${parts.slice(-2).join(".")}`);
  }
  for (const part of document.cookie.split("; ")) {
    const name = part.split("=")[0];
    if (name === "_fbp" || name === "_fbc") {
      for (const domain of domains) {
        document.cookie = `${name}=; Path=/; Domain=${domain}; Max-Age=0`;
      }
      document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
  }
}
