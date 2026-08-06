/**
 * Rutene som fanges av en intercepting-route og vises som modal oppå siden
 * man står på (`app/(frontend)/@modal/`). Lenker hit skal IKKE scrolle siden
 * til toppen — bakgrunnen blir stående der brukeren var. Alle andre lenker
 * skal ha Next sin vanlige «scroll til toppen»-oppførsel.
 */
export function isInterceptedHref(href: string): boolean {
  // Bare interne stier kan fanges opp.
  if (!href.startsWith("/")) return false;

  const path = href.split(/[?#]/)[0]?.replace(/\/+$/, "") || "/";

  if (path === "/kontakt") return true;
  // /tjenester/[slug] (men ikke selve oversikten /tjenester)
  if (/^\/tjenester\/[^/]+$/.test(path)) return true;

  return false;
}
