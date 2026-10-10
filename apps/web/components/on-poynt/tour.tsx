"use client";

import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { type DriveStep, driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect } from "react";

/**
 * Delt driver.js-motor for On Poynt-omvisninger — brukt både av skall-touren
 * (ShellTour) og mikro-omvisningene inne i verktøyene. Holder norsk knappetekst,
 * «sett som sett»-persistens og robust filtrering av manglende ankre ett sted.
 */

export function hasSeenTour(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return true; // Uten localStorage: ikke mas — la brukeren starte den selv.
  }
}

export function markTourSeen(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // localStorage utilgjengelig (privat modus e.l.) — ikke kritisk.
  }
}

/**
 * Kjør en omvisning. Steg med en `element`-selektor som ikke finnes i DOM-en
 * filtreres bort, så den er robust uansett hvilken tilstand siden er i. Trenger
 * mer enn ett gjenværende steg for å ha verdi (ellers markeres den bare som sett).
 */
export function runTour(steps: DriveStep[], onDone?: () => void): void {
  const present = steps.filter(
    (step) => !step.element || document.querySelector(step.element as string)
  );
  if (present.length <= 1) {
    onDone?.();
    return;
  }

  driver({
    showProgress: true,
    steps: present,
    nextBtnText: "Neste",
    prevBtnText: "Tilbake",
    doneBtnText: "Ferdig",
    progressText: "{{current}} av {{total}}",
    onDestroyed: () => onDone?.(),
  }).drive();
}

/**
 * «Vis omvisning»-knapp for et verktøy. Kjører en kort mikro-omvisning av de
 * ikke-åpenbare delene. `autoRun` starter den automatisk én gang (per `tourKey`);
 * gate den på `!isStreaming` så vi ikke peker på elementer som ennå bygger seg opp.
 */
export function TourButton({
  tourKey,
  steps,
  label = "Vis omvisning",
  autoRun = false,
  delayMs = 500,
}: {
  tourKey: string;
  steps: DriveStep[];
  label?: string;
  autoRun?: boolean;
  delayMs?: number;
}) {
  const start = () => runTour(steps, () => markTourSeen(tourKey));

  // biome-ignore lint/correctness/useExhaustiveDependencies: `steps`/`start` er nye referanser hver render (inline definert); vi vil bevisst bare auto-kjøre når autoRun/tourKey endrer seg, ikke på steg-identitet.
  useEffect(() => {
    if (!autoRun || hasSeenTour(tourKey)) return;
    const timer = setTimeout(start, delayMs);
    return () => clearTimeout(timer);
  }, [autoRun, tourKey, delayMs]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="gap-2 text-muted-foreground"
      onClick={start}
    >
      <Icon name="lightbulb" className="size-4" />
      {label}
    </Button>
  );
}
