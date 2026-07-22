import {
  generateBlurDataURL,
  supportsBlurPlaceholder,
} from "@/lib/blur-data-url";
/**
 * Fyller ut `blurDataURL` (base64 LQIP for `placeholder="blur"`) på eksisterende
 * Media-dokumenter lastet opp FØR feltet/hooken ble lagt til.
 *
 * Idempotent: hopper over dokumenter som allerede har blur, og ikke-rasterbilder
 * (video/pdf/svg). Laster ned originalfilen og oppdaterer kun feltet — filen
 * re-prosesseres ikke.
 *
 * Henter filene rett fra Vercel Blob når BLOB_READ_WRITE_TOKEN er satt (krever
 * ikke kjørende dev-server); ellers via /api/media/file-ruten.
 *
 *   bun run --cwd apps/web payload run scripts/backfill-media-blur.ts
 */
import config from "@payload-config";
import { list } from "@vercel/blob";
import { getPayload } from "payload";

/** filnavn → offentlig blob-URL for alle blobs i storen. */
async function fetchBlobUrlMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return map;
  }
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });
    for (const blob of page.blobs) {
      // Storage-pluginen lagrer på filnavnet (ev. med prefix) — nøkle på siste
      // path-segment, som matcher Payloads `filename`.
      const name = blob.pathname.split("/").pop();
      if (name && !map.has(name)) {
        map.set(name, blob.url);
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return map;
}

async function main() {
  const payload = await getPayload({ config });
  const blobUrls = await fetchBlobUrlMap();

  const { docs } = await payload.find({
    collection: "media",
    limit: 2000,
    depth: 0,
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    if (!supportsBlurPlaceholder(doc.mimeType) || doc.blurDataURL || !doc.url) {
      skipped++;
      continue;
    }

    try {
      // Foretrekk direkte blob-URL; fall tilbake til app-ruten.
      const fileUrl =
        (doc.filename && blobUrls.get(doc.filename)) ||
        (doc.url.startsWith("http")
          ? doc.url
          : `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${doc.url}`);
      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ved henting av ${fileUrl}`);
      }
      const data = Buffer.from(await res.arrayBuffer());

      const blurDataURL = await generateBlurDataURL(data);
      if (!blurDataURL) {
        throw new Error("sharp klarte ikke å lese filen");
      }

      await payload.update({
        collection: "media",
        id: doc.id,
        data: { blurDataURL },
      });
      updated++;
      console.log(`✓ ${doc.filename} (${doc.id})`);
    } catch (error) {
      failed++;
      console.error(`✗ ${doc.filename} (${doc.id}):`, error);
    }
  }

  console.log(
    `Ferdig: ${updated} oppdatert, ${skipped} hoppet over, ${failed} feilet.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

await main();
