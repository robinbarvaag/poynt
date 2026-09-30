"use client";

import type { ServiceModalData } from "@/components/service-modal";

/**
 * Klient-side minne om tjenestene som står i oversikten, nøklet på slug.
 *
 * Tjeneste-modalet er en intercepting-route hvis innhold må hentes fra
 * serveren ved hvert klikk. Kortdataene (navn, pris, ingress, bilde) finnes
 * derimot allerede på klienten når brukeren klikker — `ServiceExplorer`
 * legger dem her, og Suspense-fallbacken i `@modal/(.)tjenester/[slug]`
 * viser dem i modal-skallet i samme øyeblikk. Bare den rike teksten
 * streamer inn etterpå.
 *
 * Modulen deles av oversikten og modal-sloten (søsken i layouten), derfor et
 * modul-globalt Map og ikke React-context.
 */
const services = new Map<string, ServiceModalData>();

/** Slug-er der forhåndsvisningen alt står på skjermen — se `ServiceModal`. */
const previewShown = new Set<string>();
/** Slug-er der brukeren lukket forhåndsvisningen før innholdet kom. */
const previewDismissed = new Set<string>();
/**
 * Slug-er der lukkingen av forhåndsvisningen ennå ikke er fullført med et
 * tilbake-steg. Forhåndsvisningen kan bli byttet ut med det ekte innholdet
 * midt i exit-animasjonen (før `onClosed`), så både den og `ServiceModal`
 * prøver å fullføre — `takeBackPending` sørger for at bare én gjør det.
 */
const backPending = new Set<string>();

export function rememberServices(
  items: (ServiceModalData & { slug: string })[]
) {
  for (const item of items) {
    services.set(item.slug, item);
  }
}

export function getRememberedService(
  slug: string
): ServiceModalData | undefined {
  return services.get(slug);
}

/** `/tjenester/<slug>` → `<slug>`, ellers null. */
export function slugFromPathname(pathname: string): string | null {
  const match = /^\/tjenester\/([^/?#]+)\/?$/.exec(pathname);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function markPreviewShown(slug: string) {
  previewShown.add(slug);
  previewDismissed.delete(slug);
}

export function markPreviewDismissed(slug: string) {
  previewDismissed.add(slug);
  backPending.add(slug);
}

/** Sann nøyaktig én gang per lukking — den som får `true` kjører `back()`. */
export function takeBackPending(slug: string): boolean {
  return backPending.delete(slug);
}

/** Leser og nullstiller — hver forhåndsvisning teller én gang. */
export function consumePreviewState(slug: string): {
  shown: boolean;
  dismissed: boolean;
} {
  const state = {
    shown: previewShown.has(slug),
    dismissed: previewDismissed.has(slug),
  };
  previewShown.delete(slug);
  previewDismissed.delete(slug);
  return state;
}
