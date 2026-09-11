"use client";

import {
  ALL_DENIED,
  ALL_GRANTED,
  type ConsentCategories,
  type ConsentState,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface ConsentContextValue {
  /** `undefined` = ikke lest fra cookie ennå (SSR/første render). `null` = ikke besvart. */
  consent: ConsentState | null | undefined;
  settingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (categories: ConsentCategories) => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null | undefined>(
    undefined
  );
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Cookien finnes bare i nettleseren — les etter montering for å unngå
  // hydration-mismatch.
  useEffect(() => {
    setConsent(readConsent());
  }, []);

  const save = useCallback((categories: ConsentCategories) => {
    setConsent(writeConsent(categories));
    setSettingsOpen(false);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      settingsOpen,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
      acceptAll: () => save(ALL_GRANTED),
      rejectAll: () => save(ALL_DENIED),
      save,
    }),
    [consent, settingsOpen, save]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent må brukes innenfor <ConsentProvider>");
  }
  return ctx;
}
