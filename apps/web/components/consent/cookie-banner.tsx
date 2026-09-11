"use client";

import { Button, Switch, Text } from "@poynt/ui";
import { Cookie, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useConsent } from "./consent-provider";

/**
 * Samtykkebanner for informasjonskapsler.
 *
 * Krav (ekomloven § 3-15 / GDPR, Datatilsynets veiledning):
 *  - «Avvis alle» og «Godta alle» er likestilte, like synlige knapper.
 *  - Ingen forhåndsavkryssede valg utover nødvendige.
 *  - Valget kan endres senere (lenke i footer åpner dette på nytt).
 *  - Ingen sporing før valget er tatt (GoogleAnalytics venter på consent).
 *
 * Banneret blokkerer ikke siden — det er et ikke-modalt dialog-kort nederst.
 */
export function CookieBanner() {
  const { consent, settingsOpen, closeSettings, acceptAll, rejectAll, save } =
    useConsent();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const titleId = useId();
  const descId = useId();

  // Når innstillingene åpnes fra footeren: start på det som faktisk er lagret.
  useEffect(() => {
    if (settingsOpen) {
      setAnalytics(consent?.categories.analytics ?? false);
      setShowDetails(true);
    }
  }, [settingsOpen, consent]);

  // undefined = ikke lest ennå (SSR); satt + ikke åpnet = ingenting å vise.
  if (consent === undefined) return null;
  if (consent !== null && !settingsOpen) return null;

  const canDismiss = consent !== null;

  return (
    // biome-ignore lint/a11y/useSemanticElements: ikke-modalt kort; <dialog> gir top-layer/backdrop-semantikk vi ikke vil ha
    <div
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-lg rounded-3xl border border-border bg-card p-5 shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-500 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Cookie className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="font-semibold text-foreground">
            Informasjonskapsler
          </h2>
          <p id={descId} className="mt-1 text-sm text-muted-foreground">
            Vi bruker nødvendige informasjonskapsler for at handlekurv og
            innlogging skal virke. Med ditt samtykke bruker vi også Google
            Analytics for å forstå hvordan siden brukes.{" "}
            <Link
              href="/personvern"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Les mer i personvernerklæringen
            </Link>
            .
          </p>
        </div>
        {canDismiss && (
          <button
            type="button"
            onClick={closeSettings}
            aria-label="Lukk"
            className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showDetails && (
        <ul className="mt-4 space-y-3 border-t border-border pt-4">
          <li className="flex items-center justify-between gap-4">
            <div>
              <Text weight="medium" customStyles="text-sm">
                Nødvendige
              </Text>
              <Text variant="muted" customStyles="text-xs">
                Handlekurv, innlogging, betaling og ditt samtykkevalg.
              </Text>
            </div>
            <Switch checked disabled aria-label="Nødvendige (alltid på)" />
          </li>
          <li className="flex items-center justify-between gap-4">
            <div>
              <label
                htmlFor="consent-analytics"
                className="block text-sm font-medium text-foreground"
              >
                Statistikk
              </label>
              <Text variant="muted" customStyles="text-xs">
                Google Analytics. Anonymiserte besøkstall som hjelper oss å
                forbedre siden.
              </Text>
            </div>
            <Switch
              id="consent-analytics"
              checked={analytics}
              onCheckedChange={setAnalytics}
            />
          </li>
        </ul>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        {showDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => save({ analytics })}
          >
            Lagre valg
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(true)}
          >
            Tilpass
          </Button>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={rejectAll}>
            Avvis alle
          </Button>
          <Button type="button" onClick={acceptAll}>
            Godta alle
          </Button>
        </div>
      </div>
    </div>
  );
}
