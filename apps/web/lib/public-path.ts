/**
 * Offentlig sti på nettsiden for et dokument i en gitt collection. Én felles
 * mapping slik at admin («Åpne på nettsiden»), sitemap og preview-lenker peker
 * samme sted. Returnerer null for collections uten egen side.
 */
export function getPublicPath(
  collectionSlug: string,
  slug: string | null | undefined
): string | null {
  if (!slug) return null;
  switch (collectionSlug) {
    case "pages":
      return slug === "forside" ? "/" : `/${slug}`;
    case "blog-posts":
      return `/blogg/${slug}`;
    case "case-studies":
      return `/kundehistorier/${slug}`;
    case "services":
      return `/tjenester/${slug}`;
    case "products":
      return `/produkter/${slug}`;
    case "events":
      return `/eventer/${slug}`;
    case "guides":
      return `/on-poynt/ressurser/${slug}`;
    case "courses":
      return `/on-poynt/kurs/${slug}`;
    default:
      return null;
  }
}

export function getPublicUrl(
  collectionSlug: string,
  slug: string | null | undefined
): string | null {
  const path = getPublicPath(collectionSlug, slug);
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  return `${base}${path}`;
}
