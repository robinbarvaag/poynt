import type { MediaResource } from "@/components/payload-image";
import type { Metadata } from "next";
import { resolveMediaUrl } from "./payload";

/** Side-URL ett sted, med lokal fallback. */
export const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

type MediaInput = MediaResource | number | null | undefined;

/** Nettstedsnavn brukes som tittel-suffiks (samme som template i layouten). */
export const SITE_NAME = "Poynt";

/**
 * Fjerner et utilsiktet «| Poynt»-suffiks fra en tittel. Layouten legger på
 * suffikset automatisk via `title.template`, så om en redaktør (eller en
 * gammel fallback) skriver «Tjenester | Poynt» unngår vi «… | Poynt | Poynt».
 */
export function stripSiteSuffix(title: string): string {
  return title
    .replace(new RegExp(`\\s*[|–-]\\s*${SITE_NAME}\\s*$`, "i"), "")
    .trim();
}

export type BuildMetadataOpts = {
  title: string;
  /**
   * Sett `true` for sider som ikke skal ha «| Poynt»-suffikset (f.eks.
   * forsiden, der tittelen allerede er merkenavnet).
   */
  absoluteTitle?: boolean;
  description?: string;
  /** Sti relativt til `SITE_URL`, f.eks. "/blogg" eller "" for rot. */
  path?: string;
  /** Payload-media (eller ferdig URL) for OG-bildet. */
  image?: MediaInput | string;
  type?: "website" | "article";
  /** ISO-dato for `article`-typer. */
  publishedTime?: string;
  noIndex?: boolean;
  /** Ta med Twitter-kort (default `true`). */
  twitter?: boolean;
};

/**
 * Bygger en `Metadata` med canonical, Open Graph, Twitter-kort og robots fra
 * felles regler, så hver sides `generateMetadata` blir et enkelt kall.
 */
export function buildMetadata({
  title,
  absoluteTitle = false,
  description = "",
  path = "",
  image,
  type = "website",
  publishedTime,
  noIndex,
  twitter = true,
}: BuildMetadataOpts): Metadata {
  const url = `${SITE_URL}${path}`;
  const imageUrl = resolveMediaUrl(image);
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630 }]
    : undefined;

  // Forhindre dobbelt suffiks: template («%s | Poynt») i layouten legger på
  // merkenavnet, så vi rydder bort et evt. eksisterende «| Poynt» her.
  const cleanTitle = stripSiteSuffix(title);
  // OG/Twitter bruker den fullstendige tittelen (ingen template der).
  const fullTitle = absoluteTitle ? cleanTitle : `${cleanTitle} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: cleanTitle } : cleanTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(images ? { images } : {}),
    },
    ...(twitter && {
      twitter: { card: "summary_large_image", title: fullTitle, description },
    }),
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

/** Metadata for «ikke funnet»-tilfeller — tittel + skjul fra søkemotorer. */
export function notFoundMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
