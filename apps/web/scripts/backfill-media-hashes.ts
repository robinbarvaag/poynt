/**
 * Beregner fingeravtrykk (contentHash + perceptualHash) for bilder som ble
 * lastet opp FØR duplikatsjekken fantes. Nye opplastinger får dem automatisk
 * via beforeChange-hooken i collections/media.ts.
 *
 * Idempotent: hopper over bilder som allerede har avtrykk, og over svg/video/
 * pdf som ikke har et meningsfullt avtrykk.
 *
 * Skriver med rå SQL og ikke `payload.update`, av to grunner: kolonnene er rene
 * maskin-felter, og en vanlig oppdatering får Payload til å laste ned og skrive
 * over selve fila på nytt (payloadcms/payload#13182) — noe vi ikke vil betale
 * for på hvert eneste bilde i biblioteket.
 *
 *   bun run --cwd apps/web payload run scripts/backfill-media-hashes.ts
 */
import { contentHash, perceptualHash, supportsHashing } from "@/lib/media-hash";
import config from "@payload-config";
import { getPayload } from "payload";

async function main() {
  const payload = await getPayload({ config });
  const pool = (
    payload.db as unknown as {
      pool: {
        query: (text: string, values?: unknown[]) => Promise<unknown>;
      };
    }
  ).pool;

  const { docs } = await payload.find({
    collection: "media",
    depth: 0,
    limit: 5000,
    pagination: false,
  });

  let hashed = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    if (!supportsHashing(doc.mimeType) || doc.contentHash || !doc.url) {
      skipped++;
      continue;
    }

    try {
      const fileUrl = doc.url.startsWith("http")
        ? doc.url
        : `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}${doc.url}`;
      const res = await fetch(fileUrl);
      if (!res.ok) {
        console.warn(`  ${doc.filename}: kunne ikke hentes (${res.status})`);
        failed++;
        continue;
      }
      const bytes = Buffer.from(await res.arrayBuffer());

      await pool.query(
        'UPDATE "media" SET "content_hash" = $1, "perceptual_hash" = $2 WHERE "id" = $3',
        [contentHash(bytes), await perceptualHash(bytes), doc.id]
      );
      hashed++;
      console.log(`  ${doc.filename}: ok`);
    } catch (err) {
      failed++;
      console.warn(
        `  ${doc.filename}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  console.log(
    `\nFerdig. Avtrykk laget: ${hashed}, hoppet over: ${skipped}, feilet: ${failed}.`
  );
  process.exit(0);
}

main();
