"use client";

import type { DriveStep } from "driver.js";
import { useEffect } from "react";
import { hasSeenTour, markTourSeen, runTour } from "./tour";

/**
 * Skall-omvisning for On Poynt: en kort, skippbar orientering om HVOR ting bor
 * (navigasjon, bedriftsbytte, søk) — ikke en gjentakelse av den guidede reisen
 * på forsiden (NextStepHero + JourneyPath), som allerede forklarer HVA du bør
 * gjøre. Kjører automatisk én gang ved første innlogging, og kan spilles av på
 * nytt via `startShellTour()` (knapp i bruker-menyen).
 */

const SEEN_KEY = "on-poynt-shell-tour-v1";
/** Andre komponenter kan be om omvisningen ved å sende dette event-et. */
export const START_TOUR_EVENT = "on-poynt:start-shell-tour";

/**
 * Stegene. `element` er en CSS-selektor (eller utelatt for et sentrert
 * velkomststeg). Steg vises bare hvis elementet faktisk finnes i DOM-en, så
 * omvisningen er robust uansett hvilken side den startes fra.
 */
const STEPS: DriveStep[] = [
  {
    popover: {
      title: "Velkommen til On Poynt 👋",
      description:
        "La oss bruke 20 sekunder på å vise hvor ting bor. Du kan hoppe over når som helst.",
    },
  },
  {
    element: '[data-tour="workspace-switcher"]',
    popover: {
      title: "Bedriften din",
      description:
        "Her ser og bytter du bedrift. Alt du lager — profil, planer og innhold — hører til bedriften som er valgt her.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-tools"]',
    popover: {
      title: "Verktøyene",
      description:
        "Kjerneverktøyene følger den guidede reisen: finn kanaler → lag markedsplan → planlegg året.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-learn"]',
    popover: {
      title: "Læring",
      description: "Kurs og guider — samlet på ett sted når du vil lære mer.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-business"]',
    popover: {
      title: "Din bedrift",
      description:
        "Profilen og strategien din. Jo mer du fyller ut, jo skarpere blir alt AI-verktøyene lager.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="search"]',
    popover: {
      title: "Søk deg fram",
      description: "Hopp rett til verktøy, sider og innhold — hvor som helst.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="journey"]',
    popover: {
      title: "Din vei videre",
      description:
        "På forsiden ligger den guidede reisen. Den vet hvor langt du har kommet og peker alltid på det neste steget.",
      side: "top",
      align: "start",
    },
  },
];

export function startShellTour() {
  runTour(STEPS, () => markTourSeen(SEEN_KEY));
}

export function ShellTour() {
  useEffect(() => {
    // Auto-kjør én gang ved første innlogging. Liten forsinkelse så sidebar/
    // header (klient-komponenter) rekker å montere før vi måler elementene.
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!hasSeenTour(SEEN_KEY)) {
      timer = setTimeout(() => startShellTour(), 600);
    }

    // La andre komponenter (f.eks. «Vis omvisning»-knappen) starte den på nytt.
    const handler = () => startShellTour();
    window.addEventListener(START_TOUR_EVENT, handler);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(START_TOUR_EVENT, handler);
    };
  }, []);

  return null;
}
