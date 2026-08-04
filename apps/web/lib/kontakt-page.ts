import config from "@/payload.config";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

/**
 * Kontakt-siden hentes tre steder (dedikert rute, intercepting-modal og — som
 * fallback — catch-all-ruta). Felles henter gir én cache-entry og ETT sted å
 * holde publiserings-filteret riktig.
 */
export async function getKontaktPage() {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });
  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: { equals: "kontakt" },
      _status: { equals: "published" },
    },
    limit: 1,
    depth: 2,
  });
  return pages.docs[0] || null;
}

/**
 * Regnes en blokk som «hero» (siden skal da ikke få PageHero i tillegg)?
 * Delt mellom [...slug] og kontakt-ruta så definisjonen ikke driver fra
 * hverandre — bookHero teller også som hero.
 */
export function isHeroBlockType(blockType?: string): boolean {
  return blockType === "hero" || blockType === "bookHero";
}
