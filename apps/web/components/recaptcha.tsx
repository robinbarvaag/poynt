"use client";

import { RECAPTCHA_HEADER } from "@poynt/utils/recaptcha";
import Link from "next/link";
import { useCallback, useEffect } from "react";

/**
 * Google reCAPTCHA v3 på klienten.
 *
 * v3 spør aldri brukeren om noe — nettleseren henter et token i bakgrunnen
 * som serveren sjekker (packages/utils/recaptcha.ts). Scriptet lastes først
 * når et skjema faktisk vises, ikke på hver eneste side, slik at forsida ikke
 * betaler for et skjema den ikke har.
 *
 * Badgen nede i høyre hjørne er skjult i globals.css. Google tillater det så
 * lenge teksten står ved skjemaet i stedet — det er det <RecaptchaNotice>
 * gjør. Bruk alltid de to sammen.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SCRIPT_ID = "google-recaptcha-v3";

interface Grecaptcha {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/** Én felles last per side — flere skjemaer skal ikke laste scriptet på nytt. */
let loader: Promise<Grecaptcha | null> | null = null;

function loadRecaptcha(): Promise<Grecaptcha | null> {
  if (!SITE_KEY) return Promise.resolve(null);
  if (typeof window === "undefined") return Promise.resolve(null);
  if (loader) return loader;

  loader = new Promise<Grecaptcha | null>((resolve) => {
    const done = () => {
      const api = window.grecaptcha;
      if (!api) {
        resolve(null);
        return;
      }
      api.ready(() => resolve(api));
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      // Allerede lagt inn av et annet skjema — vent på at det blir klart.
      if (window.grecaptcha) done();
      else existing.addEventListener("load", done, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", done, { once: true });
    script.addEventListener(
      "error",
      () => {
        // Blokkert av utvidelse eller nede: skjemaet skal fortsatt kunne
        // sendes. Serveren avgjør selv hva den gjør med et manglende token.
        loader = null;
        resolve(null);
      },
      { once: true }
    );
    document.head.appendChild(script);
  });

  return loader;
}

/**
 * Henter et ferskt reCAPTCHA-token for en handling.
 *
 * `action` er navnet Google knytter til tokenet, og serveren sjekker at det
 * stemmer — da kan ikke et token fra nyhetsbrevet gjenbrukes mot påmeldingen.
 * Google tillater kun bokstaver, tall, understrek og skråstrek i navnet.
 *
 * Returnerer null når reCAPTCHA ikke er satt opp eller ikke lot seg laste.
 */
export function useRecaptcha(action: string) {
  // Varm opp scriptet med en gang skjemaet vises — tokenet skal ikke koste
  // brukeren en ekstra runde nedlasting i det hen trykker «Send».
  useEffect(() => {
    void loadRecaptcha();
  }, []);

  return useCallback(async (): Promise<string | null> => {
    const api = await loadRecaptcha();
    if (!api || !SITE_KEY) return null;
    try {
      return await api.execute(SITE_KEY, { action });
    } catch (error) {
      console.warn("[recaptcha] kunne ikke hente token:", error);
      return null;
    }
  }, [action]);
}

/** Header-objekt å spre inn i fetch. Tomt når vi ikke har noe token. */
export function recaptchaHeader(token: string | null): Record<string, string> {
  return token ? { [RECAPTCHA_HEADER]: token } : {};
}

/**
 * Teksten Google krever når badgen er skjult. Skal stå synlig ved hvert
 * skjema som henter et token.
 */
export function RecaptchaNotice({ className = "" }: { className?: string }) {
  // Ingen nøkkel = ingen reCAPTCHA i dette miljøet = ingenting å opplyse om.
  if (!SITE_KEY) return null;

  return (
    <p className={`text-xs leading-relaxed opacity-75 ${className}`}>
      Beskyttet av reCAPTCHA. Googles{" "}
      <Link
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-100"
      >
        personvernerklæring
      </Link>{" "}
      og{" "}
      <Link
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 hover:opacity-100"
      >
        vilkår
      </Link>{" "}
      gjelder.
    </p>
  );
}
