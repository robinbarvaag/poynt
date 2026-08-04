import type { CollectionBeforeChangeHook } from "payload";
import { fetchOgMeta, ogStatusText } from "./og";

type BookmarkItem = {
  url?: unknown;
  title?: string;
  description?: string;
  image?: unknown;
  imageUrl?: string;
  ogStatus?: string;
};

/** Har bokmerket et manuelt opplastet forhåndsvisningsbilde? */
function hasManualImage(item: BookmarkItem): boolean {
  const img = item.image;
  if (img == null || img === "") return false;
  if (typeof img === "object") return Object.keys(img).length > 0;
  return true;
}

/**
 * Beriker bokmerke-blokker med OG-data fra lenken ved lagring. «Har vi hentet
 * enda?»-markøren er OG-bilde-feltet (imageUrl) ALENE – ikke tittel: en manuelt
 * skrevet tittel skal ikke blokkere henting av beskrivelse/bilde. Hvert felt
 * fylles kun hvis det er tomt, så manuelle verdier overstyrer alltid. Tøm
 * OG-bilde-feltet i admin for å trigge ny henting.
 *
 * Merk: mange nettsteder eksponerer ingen og:image (eller er rene JS-apper uten
 * meta i server-HTML) – da forblir imageUrl tom og frontend faller pent tilbake
 * til favicon + domene. `ogStatus` forteller partneren hva som faktisk skjedde.
 */
export const enrichBookmarks: CollectionBeforeChangeHook = async ({ data }) => {
  const blocks = (data as { content?: unknown })?.content;
  if (!Array.isArray(blocks)) return data;

  // Hent alle lenkene parallelt — sekvensielt kunne ti bokmerker à 6 s
  // timeout legge ~60 s på en autosave (guides autosaver).
  const pending: Promise<void>[] = [];
  for (const block of blocks) {
    if (block?.blockType !== "guideBookmark" || !Array.isArray(block.items)) {
      continue;
    }
    for (const item of block.items as BookmarkItem[]) {
      const url = typeof item?.url === "string" ? item.url.trim() : "";
      if (!url || item.imageUrl) continue;

      pending.push(
        fetchOgMeta(url).then((og) => {
          if (og.title && !item.title) item.title = og.title;
          if (og.description && !item.description)
            item.description = og.description;
          if (og.image) item.imageUrl = og.image;

          item.ogStatus = ogStatusText(og, {
            title: Boolean(item.title),
            description: Boolean(item.description),
            image: Boolean(item.imageUrl) || hasManualImage(item),
          });
        })
      );
    }
  }
  await Promise.all(pending);

  return data;
};
