"use server";

import config from "@/payload.config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";

/**
 * Stock-bilder: søk i Pexels (gratis foto) og Giphy (GIF-er) direkte fra
 * Payload-admin, og importér valgt bilde inn i Media-collection. Selve
 * nedlastingen og opprettelsen skjer på serveren slik at API-nøklene aldri
 * eksponeres mot klienten, og bildet kjøres gjennom Payloads vanlige
 * upload-pipeline (sharp + Vercel Blob) som ethvert annet opplastet bilde.
 *
 * Pexels ble valgt framfor Unsplash fordi Pexels-lisensen eksplisitt tillater
 * nedlasting + re-hosting — det passer med Payloads «last opp til Media»-modell.
 * Unsplash sine API-vilkår krever hotlinking (§6), som ikke lar bildet bli et
 * vanlig Media-dokument. Se docs/STOCK-MEDIA.md.
 *
 * Nøkler (gratis): PEXELS_API_KEY, GIPHY_API_KEY.
 */

export type StockSource = "pexels" | "giphy";

export type StockImage = {
  /** Stabil id fra kilden (brukes som React-key + filnavn). */
  id: string;
  source: StockSource;
  /** Liten forhåndsvisning til rutenettet. */
  thumbUrl: string;
  /** URL-en vi faktisk laster ned ved import. */
  downloadUrl: string;
  width: number;
  height: number;
  /** Kreditering, f.eks. fotografens navn eller GIF-tittel. */
  credit: string;
  /** Lenke til kilden (fotografprofil / Giphy-side) for kreditering. */
  sourceUrl: string;
  /** Alt-tekst hvis kilden tilbyr en (Pexels gir `alt`). */
  alt: string;
  isGif: boolean;
};

export type StockSearchResult =
  | { ok: true; images: StockImage[]; hasMore: boolean }
  | { ok: false; error: string };

export type StockImportResult =
  | { ok: true; id: string | number; filename: string }
  | { ok: false; error: string };

const PER_PAGE = 24;

/** Kun innloggede admin-brukere får bruke stock-søket/importen. */
async function requireAdmin() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) {
    return { payload, error: "Ikke autorisert" as const };
  }
  return { payload, error: null };
}

export async function searchPexels(
  query: string,
  page = 1
): Promise<StockSearchResult> {
  const { error } = await requireAdmin();
  if (error) return { ok: false, error };

  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "PEXELS_API_KEY mangler i miljøet. Se docs/STOCK-MEDIA.md.",
    };
  }
  if (!query.trim()) return { ok: true, images: [], hasMore: false };

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(PER_PAGE));
    url.searchParams.set("locale", "nb-NO");

    const res = await fetch(url, {
      headers: { Authorization: key },
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `Pexels svarte ${res.status}. Sjekk at nøkkelen er gyldig.`,
      };
    }
    const data = (await res.json()) as {
      next_page?: string;
      photos: Array<{
        id: number;
        width: number;
        height: number;
        url: string;
        alt: string | null;
        photographer: string;
        photographer_url: string;
        src: { large2x: string; large: string; medium: string };
      }>;
    };

    const images: StockImage[] = data.photos.map((p) => ({
      id: String(p.id),
      source: "pexels",
      thumbUrl: p.src.medium,
      downloadUrl: p.src.large2x,
      width: p.width,
      height: p.height,
      credit: p.photographer,
      sourceUrl: p.photographer_url,
      alt: p.alt?.trim() || query,
      isGif: false,
    }));

    return { ok: true, images, hasMore: Boolean(data.next_page) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ukjent feil mot Pexels",
    };
  }
}

export async function searchGiphy(
  query: string,
  page = 1
): Promise<StockSearchResult> {
  const { error } = await requireAdmin();
  if (error) return { ok: false, error };

  const key = process.env.GIPHY_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: "GIPHY_API_KEY mangler i miljøet. Se docs/STOCK-MEDIA.md.",
    };
  }
  if (!query.trim()) return { ok: true, images: [], hasMore: false };

  try {
    const offset = (page - 1) * PER_PAGE;
    const url = new URL("https://api.giphy.com/v1/gifs/search");
    url.searchParams.set("api_key", key);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(PER_PAGE));
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("rating", "pg-13");
    url.searchParams.set("bundle", "messaging_non_clips");

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        error: `Giphy svarte ${res.status}. Sjekk at nøkkelen er gyldig.`,
      };
    }
    const data = (await res.json()) as {
      pagination: { total_count: number; count: number; offset: number };
      data: Array<{
        id: string;
        title: string;
        url: string;
        username: string;
        images: {
          original: { url: string; width: string; height: string };
          fixed_width: { url: string };
        };
      }>;
    };

    const images: StockImage[] = data.data.map((g) => ({
      id: g.id,
      source: "giphy",
      thumbUrl: g.images.fixed_width.url,
      downloadUrl: g.images.original.url,
      width: Number(g.images.original.width) || 0,
      height: Number(g.images.original.height) || 0,
      credit: g.title?.trim() || g.username || "Giphy",
      sourceUrl: g.url,
      alt: g.title?.trim() || query,
      isGif: true,
    }));

    const { pagination } = data;
    return {
      ok: true,
      images,
      hasMore: pagination.offset + pagination.count < pagination.total_count,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Ukjent feil mot Giphy",
    };
  }
}

export async function importStockImage(
  image: StockImage
): Promise<StockImportResult> {
  const { payload, error } = await requireAdmin();
  if (error) return { ok: false, error };

  try {
    const res = await fetch(image.downloadUrl, { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        error: `Kunne ikke laste ned bildet (${res.status})`,
      };
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimetype = image.isGif ? "image/gif" : "image/jpeg";
    const ext = image.isGif ? "gif" : "jpg";
    const filename = `${image.source}-${image.id}.${ext}`;

    const creditLine =
      image.source === "pexels"
        ? `Foto: ${image.credit} / Pexels`
        : `GIF: ${image.credit} / Giphy`;

    const created = await payload.create({
      collection: "media",
      data: {
        alt: image.alt,
        source: image.source,
        creditLine,
        sourceUrl: image.sourceUrl,
      },
      file: {
        data: buffer,
        mimetype,
        name: filename,
        size: buffer.length,
      },
    });

    return { ok: true, id: created.id, filename };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Import feilet",
    };
  }
}
