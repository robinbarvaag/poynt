/**
 * Payload bygger media-URL-er som ABSOLUTTE (`${serverURL}/api/media/file/...`)
 * der serverURL er `NEXT_PUBLIC_URL` slik den var da dokumentet ble lagret
 * eller siden ble (pre)rendret. Med `use cache`/cacheComponents skjer det på
 * build-tidspunktet, og Blob-pluginen persisterer verdien i databasen, så en
 * feil eller manglende env-verdi (typisk `http://localhost:3000`) bakes inn og
 * gir døde bilder. Media serveres alltid av appen selv, så vi stripper verten
 * og beholder stien — den virker på alle domener (localhost, preview, prod).
 * Eksterne URL-er (Blob-CDN, Pexels o.l.) har andre stier og passerer uendret.
 *
 * Ren funksjon uten Next-avhengigheter, så den kan brukes både fra
 * `payload.config`/collections (server, CLI) og fra frontend-komponenter.
 */
export function toRelativeMediaUrl(url: string): string {
  if (!url.includes("/api/media/")) {
    return url;
  }
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/api/media/")) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // Allerede relativ (`new URL` kaster) — riktig som den er.
  }
  return url;
}
