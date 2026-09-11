"use client";

import { useConsent } from "./consent-provider";

/** Footer-lenke som åpner samtykkebanneret på nytt, så valget kan endres. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Informasjonskapsler
    </button>
  );
}
