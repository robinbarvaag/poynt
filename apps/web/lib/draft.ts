import config from "@/payload.config";
import { draftMode } from "next/headers";
import { getPayload } from "payload";

/**
 * Utkast-lesing for forhåndsvisning: /api/preview slår på Next draft mode og
 * sender redaktøren til /forhandsvisning-ruta, som henter ucachet med
 * `draft: true` slik at redaktøren ser siste autosave — også for dokumenter
 * som aldri er publisert. KUN /forhandsvisning skal bruke disse hjelperne;
 * offentlige sider leser aldri draft-cookien (det ville gjort dem dynamiske
 * og ødelagt prefetch/instant navigation).
 */

/** Er draft mode på? (runtime-data — kall bak Suspense i cachede trær.) */
export async function isDraftModeEnabled(): Promise<boolean> {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    // Utenfor request-kontekst (f.eks. prerender av statiske params).
    return false;
  }
}

/** Hent siste utkast av et dokument på slug — bevisst UTEN cache. */
export async function getDraftBySlug<
  TSlug extends "pages" | "blog-posts" | "case-studies",
>(collection: TSlug, slug: string) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 2,
    draft: true,
  });
  return result.docs[0] || null;
}
