import type { BreadcrumbItem } from "@poynt/ui";

/**
 * Små, faste norske struktur-labels samlet ett sted. Dette er navigasjons-/
 * seksjonstekster som ikke er reelt redaksjonelt innhold (det styres fra admin),
 * men som ellers ville ligget som spredte string-literaler i hver side.
 */

/** Forside-leddet alle brødsmulestier starter med. */
export const BREADCRUMB_HOME: BreadcrumbItem = { label: "Hjem", href: "/" };

/** Oversikts-leddene detaljsidene henger under. */
export const BREADCRUMB_ROOTS = {
  blogg: { label: "Blogg", href: "/blogg" },
  podkast: { label: "Podkast", href: "/podkast" },
  tjenester: { label: "Tjenester", href: "/tjenester" },
  produkter: { label: "Produkter", href: "/produkter" },
} as const satisfies Record<string, BreadcrumbItem>;

/**
 * Bygger en brødsmulesti `Hjem / <Oversikt> / <Tittel>` for en detaljside.
 * Siste ledd får ingen `href` (gjeldende side).
 */
export function detailBreadcrumbs(
  root: keyof typeof BREADCRUMB_ROOTS,
  title: string
): BreadcrumbItem[] {
  return [BREADCRUMB_HOME, BREADCRUMB_ROOTS[root], { label: title }];
}

/** Seksjonstitler på detaljsider. */
export const SECTION_TITLES = {
  relatedPosts: "Relaterte innlegg",
  relatedProducts: "Andre produkter",
  podcastGuests: "Gjester i denne episoden",
} as const;
