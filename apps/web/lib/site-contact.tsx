"use client";

import { createContext, useContext } from "react";

/**
 * Kontakt-e-posten fra Nettsted-innstillinger → «Kontakt». Rot-layouten legger
 * den i konteksten, så klientskjemaer kan tilby en utvei når innsendingen blir
 * stoppet: uten den står et menneske som treffer spamfilteret helt fast.
 *
 * `null` når adressen ikke er fylt ut i admin — da vises ingen ekstra linje.
 */
const SiteContactEmailContext = createContext<string | null>(null);

export function SiteContactProvider({
  email,
  children,
}: {
  email: string | null | undefined;
  children: React.ReactNode;
}) {
  return (
    <SiteContactEmailContext.Provider value={email?.trim() || null}>
      {children}
    </SiteContactEmailContext.Provider>
  );
}

export function useSiteContactEmail(): string | null {
  return useContext(SiteContactEmailContext);
}
