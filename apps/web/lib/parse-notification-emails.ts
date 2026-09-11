/**
 * Tolker en fritekststreng med varslingsadresser. Godtar komma, semikolon
 * og mellomrom som skilletegn, og kaster ut alt som ikke ser ut som en
 * e-postadresse — én skrivefeil («a@x.no.b@y.no») skal ikke velte hele
 * utsendingen. Ren funksjon uten server-avhengigheter, så den kan brukes
 * både i admin-klienten og på serveren.
 */
export function parseNotificationEmails(raw: string | null | undefined): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const part of (raw || "").split(/[,;\s]+/)) {
    const address = part.trim();
    if (!address) continue;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) valid.push(address);
    else invalid.push(address);
  }
  return { valid, invalid };
}
