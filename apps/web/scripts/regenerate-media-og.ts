/**
 * Regenererer bildestørrelser for eksisterende Media-dokumenter, slik at den
 * nye `og`-størrelsen (1200×630 for delingskort) finnes også for bilder lastet
 * opp FØR størrelsen ble lagt til i collection-configen.
 *
 * Idempotent: hopper over dokumenter som allerede har `sizes.og`, og
 * ikke-bilder (video/pdf/svg/gif animasjoner håndteres av sharp/Payload selv).
 * Laster ned originalfilen og lagrer dokumentet på nytt med `file` satt, som
 * får Payload til å kjøre sharp-pipelinen (alle imageSizes) på nytt.
 *
 *   bun run --cwd apps/web payload run scripts/regenerate-media-og.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

async function main() {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "media",
    limit: 2000,
    depth: 0,
  });

  let regenerated = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const isRasterImage =
      doc.mimeType?.startsWith("image/") && doc.mimeType !== "image/svg+xml";
    if (!isRasterImage || doc.sizes?.og?.url || !doc.url) {
      skipped++;
      continue;
    }

    try {
      // Hent originalen (lokal /api/media/file/... eller Vercel Blob-URL).
      const fileUrl = doc.url.startsWith("http")
        ? doc.url
        : `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${doc.url}`;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ved henting av ${fileUrl}`);
      }
      const data = Buffer.from(await res.arrayBuffer());

      await payload.update({
        collection: "media",
        id: doc.id,
        data: {},
        file: {
          data,
          name: doc.filename || `media-${doc.id}`,
          mimetype: doc.mimeType || "image/jpeg",
          size: data.byteLength,
        },
        overwriteExistingFiles: true,
      });
      regenerated++;
      console.log(`✓ ${doc.filename} (${doc.id})`);
    } catch (error) {
      failed++;
      console.error(`✗ ${doc.filename} (${doc.id}):`, error);
    }
  }

  console.log(
    `Ferdig: ${regenerated} regenerert, ${skipped} hoppet over, ${failed} feilet.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

await main();
