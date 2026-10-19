"use client";

import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  Switch,
  Text,
  useIsMobile,
} from "@poynt/ui";
import { Cookie } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useConsent } from "./consent-provider";

/**
 * Samtykkebanner for informasjonskapsler.
 *
 * Krav (ekomloven § 3-15 / GDPR, Datatilsynets veiledning):
 *  - «Avvis alle» og «Godta alle» er likestilte, like synlige knapper i
 *    samme lag — ett trykk for å avvise, ett for å godta.
 *  - Ingen forhåndsavkryssede valg utover nødvendige.
 *  - Valget kan endres senere (lenke i footer åpner dette på nytt).
 *  - Ingen sporing før valget er tatt (GoogleAnalytics/MetaPixel venter på
 *    consent). Unntak: Vercel Web Analytics (cookieløs, ingen persondata,
 *    berettiget interesse) — den er opplyst om i teksten og i
 *    personvernerklæringen.
 *
 * Presentasjon:
 *  - Mobil: bunn-skuff (modal) med bakteppe og låst scroll, maks 85 % av
 *    høyden — innholdet ruller inne i skuffen, så «Tilpass» aldri havner
 *    utenfor skjermen.
 *  - Desktop: lite, ikke-modalt kort nede til venstre. Siden kan brukes som
 *    vanlig mens kortet står der.
 *  - Før første valg kan banneret ikke lukkes (ingen X, Escape eller klikk
 *    utenfor). Åpnet fra footeren kan det lukkes på alle måter.
 */
export function CookieBanner() {
  const { consent, settingsOpen, closeSettings, acceptAll, rejectAll, save } =
    useConsent();
  const isMobile = useIsMobile();
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Når innstillingene åpnes fra footeren: start på det som faktisk er lagret.
  useEffect(() => {
    if (settingsOpen) {
      setAnalytics(consent?.categories.analytics ?? false);
      setMarketing(consent?.categories.marketing ?? false);
      setShowDetails(true);
    }
  }, [settingsOpen, consent]);

  // undefined = ikke lest ennå (SSR); satt + ikke åpnet = ingenting å vise.
  if (consent === undefined) return null;

  const open = consent === null || settingsOpen;
  const canDismiss = consent !== null;

  return (
    <Sheet
      open={open}
      // Mobil: modal skuff (bakteppe, låst scroll, fokusfelle).
      // Desktop: ikke-modalt kort — siden er fortsatt klikkbar bak.
      modal={isMobile}
      onOpenChange={(next) => {
        if (!next && canDismiss) closeSettings();
      }}
    >
      <SheetContent
        ref={contentRef}
        side="bottom"
        hideClose={!canDismiss}
        tabIndex={-1}
        // Radix flytter ellers fokus til første lenke i brødteksten; vi
        // fokuserer dialogen selv så skjermleseren leser tittel + tekst først.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          contentRef.current?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (!canDismiss) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (!canDismiss) event.preventDefault();
        }}
        className="flex max-h-[85dvh] flex-col rounded-t-3xl border-t bg-card p-0 outline-none md:inset-x-auto md:bottom-6 md:left-6 md:max-h-[calc(100dvh-3rem)] md:w-104 md:rounded-3xl md:border md:border-border"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-6 md:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cookie className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pr-8 md:pr-6">
              <SheetTitle className="text-base font-semibold">
                Informasjonskapsler
              </SheetTitle>
              <SheetDescription className="mt-1">
                Nødvendige informasjonskapsler holder handlekurv og innlogging i
                gang. Besøk telles anonymt uten informasjonskapsler. Med ditt
                samtykke bruker vi også Google Analytics (statistikk) og Meta
                Pixel (annonser på Facebook og Instagram).{" "}
                <Link
                  href="/personvern"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Les mer i personvernerklæringen
                </Link>
                .
              </SheetDescription>
            </div>
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
              <li className="flex items-center justify-between gap-4">
                <div>
                  <label
                    htmlFor="consent-marketing"
                    className="block text-sm font-medium text-foreground"
                  >
                    Markedsføring
                  </label>
                  <Text variant="muted" customStyles="text-xs">
                    Meta Pixel. Måler om annonser på Facebook og Instagram fører
                    til kjøp, påmeldinger og henvendelser, og kan brukes til å
                    vise deg relevante annonser der.
                  </Text>
                </div>
                <Switch
                  id="consent-marketing"
                  checked={marketing}
                  onCheckedChange={setMarketing}
                />
              </li>
            </ul>
          )}
        </div>

        {/* Knappene står fast nederst, over hjemknappen på iPhone. */}
        <div className="shrink-0 space-y-2 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-6 md:pb-6">
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={rejectAll}>
              Avvis alle
            </Button>
            <Button type="button" onClick={acceptAll}>
              Godta alle
            </Button>
          </div>
          {showDetails ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => save({ analytics, marketing })}
            >
              Lagre valg
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowDetails(true)}
            >
              Tilpass
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
