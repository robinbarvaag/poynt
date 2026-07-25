import {
  type MediaResource,
  toRelativeMediaUrl,
} from "@/components/payload-image";
import type { Metadata } from "next";

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

/** Plattform-standarden for delingsbilder: 1,91:1 (1200×630). */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

type OgImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

const OG_RATIO = OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT;
/** Hvor mye aspektet kan avvike fra 1,91:1 før vi lar være å beskjære. */
const OG_RATIO_TOLERANCE = 0.1;

/** Bygger URL til det dynamiske merkevare-kortet (`/api/og-image`). */
export function brandCardUrl(opts: {
  title: string;
  /** Absolutt eller side-relativ URL til et bilde som skal inn i kortet. */
  img?: string;
  fit?: "cover" | "contain";
}): string {
  const params = new URLSearchParams({ title: opts.title });
  if (opts.img) {
    params.set(
      "img",
      opts.img.startsWith("http") ? opts.img : `${SITE_URL}${opts.img}`
    );
    params.set("fit", opts.fit ?? "contain");
  }
  return `${SITE_URL}/api/og-image?${params.toString()}`;
}

/**
 * Velger riktig delingsbilde-variant:
 * 1. Ferdig URL-streng → brukes som den er (antatt klargjort av kallstedet).
 * 2. Media som allerede er ~1,91:1 → brukes direkte (og-beskjæringen når den
 *    finnes — eksakt 1200×630 og jpeg-komprimert — ellers originalen).
 * 3. Media med annet aspekt (logoer, portrett, skjermbilder) → det dynamiske
 *    merkevare-kortet med bildet VIST I SIN HELHET + tittel og CTA — i stedet
 *    for en dum sentrums-beskjæring som kutter motivet.
 * 4. Ingen bilde → merkevare-kortet med kun tittel og CTA.
 */
function resolveOgImage(
  image: MediaInput | string | undefined,
  fallbackTitle: string
): OgImage {
  // Media-URL-er normaliseres til host-relative stier; Next absolutter dem mot
  // `metadataBase` i layouten. Da overlever de en feil-baket serverURL i cachen.
  if (typeof image === "string" && image) {
    return { url: toRelativeMediaUrl(image) };
  }

  if (image && typeof image === "object" && image.url) {
    const { width, height } = image;
    const ratio = width && height ? width / height : null;
    const nearOgRatio =
      ratio !== null &&
      Math.abs(ratio - OG_RATIO) / OG_RATIO <= OG_RATIO_TOLERANCE;

    if (nearOgRatio) {
      const og = image.sizes?.og;
      if (og?.url) {
        return {
          url: toRelativeMediaUrl(og.url),
          width: og.width ?? OG_IMAGE_WIDTH,
          height: og.height ?? OG_IMAGE_HEIGHT,
          ...(image.alt ? { alt: image.alt } : {}),
        };
      }
      return {
        url: toRelativeMediaUrl(image.url),
        ...(width ? { width } : {}),
        ...(height ? { height } : {}),
        ...(image.alt ? { alt: image.alt } : {}),
      };
    }

    // Foto-aktige aspekter tåler cover i bildepanelet; ekstreme (brede
    // logoer, høye portretter) vises contain så ingenting kuttes.
    const fit =
      ratio !== null && ratio >= 0.75 && ratio <= 1.72 ? "cover" : "contain";
    return {
      url: brandCardUrl({
        title: fallbackTitle,
        img: toRelativeMediaUrl(image.url),
        fit,
      }),
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: image.alt || fallbackTitle,
    };
  }

  return {
    url: brandCardUrl({ title: fallbackTitle }),
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: fallbackTitle,
  };
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
  /** Overstyrer automatisk canonical (SEO-fanens «Canonical URL»-felt). */
  canonicalUrl?: string | null;
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
  canonicalUrl,
  twitter = true,
}: BuildMetadataOpts): Metadata {
  const url = `${SITE_URL}${path}`;

  // Forhindre dobbelt suffiks: template («%s | Poynt») i layouten legger på
  // merkenavnet, så vi rydder bort et evt. eksisterende «| Poynt» her.
  const cleanTitle = stripSiteSuffix(title);
  // OG/Twitter bruker den fullstendige tittelen (ingen template der).
  const fullTitle = absoluteTitle ? cleanTitle : `${cleanTitle} | ${SITE_NAME}`;

  const images = [resolveOgImage(image, cleanTitle)];

  return {
    title: absoluteTitle ? { absolute: cleanTitle } : cleanTitle,
    description,
    alternates: { canonical: canonicalUrl?.trim() || url },
    // NB: Next fletter IKKE `openGraph` fra layout og side — sidens objekt
    // erstatter hele layout-objektet. Derfor må siteName/locale gjentas her,
    // ellers mister alle undersider og:site_name og og:locale.
    openGraph: {
      title: fullTitle,
      description,
      url,
      type,
      siteName: SITE_NAME,
      locale: "nb_NO",
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    ...(twitter && {
      // `images` utelates med vilje: Next speiler openGraph.images inn i
      // twitter:image når feltet mangler her.
      twitter: { card: "summary_large_image", title: fullTitle, description },
    }),
    ...(noIndex && { robots: { index: false, follow: false } }),
  };
}

/** Metadata for «ikke funnet»-tilfeller — tittel + skjul fra søkemotorer. */
export function notFoundMetadata(title: string): Metadata {
  return { title, robots: { index: false, follow: false } };
}
