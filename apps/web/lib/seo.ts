import type { MediaResource } from "@/components/payload-image";
import type { Metadata } from "next";
import { resolveMediaUrl } from "./payload";

/** Side-URL ett sted, med lokal fallback. */
export const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

type MediaInput = MediaResource | number | null | undefined;

export type BuildMetadataOpts = {
  title: string;
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

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(images ? { images } : {}),
    },
    ...(twitter && {
      twitter: { card: "summary_large_image", title, description },
    }),
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

/** Metadata for «ikke funnet»-tilfeller — tittel + skjul fra søkemotorer. */
export function notFoundMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
