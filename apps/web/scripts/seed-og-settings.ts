/**
 * Seeder «Delingsbilder»-innstillingene i Nettsted-innstillinger: peker
 * delingskort-logoen på den horisontale Poynt-logoen og setter standard
 * CTA-tekst/stil. Idempotent: rører ikke verdier som allerede er satt.
 *
 *   bun run --cwd apps/web payload run scripts/seed-og-settings.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

async function main() {
  const payload = await getPayload({ config });

  const settings = await payload.findGlobal({
    slug: "site-settings",
    depth: 0,
  });

  const data: Record<string, unknown> = {};

  if (!settings.ogLogo && !settings.logo) {
    const { docs } = await payload.find({
      collection: "media",
      where: { filename: { contains: "poynt_horisontal" } },
      limit: 1,
      depth: 0,
    });
    if (docs[0]) {
      data.ogLogo = docs[0].id;
      console.log(`Setter delingskort-logo → ${docs[0].filename}`);
    } else {
      console.log("Fant ingen poynt_horisontal-logo i media — hopper over.");
    }
  }
  if (!settings.ogCtaText) {
    data.ogCtaText = "Les mer på poynt.no";
  }
  if (!settings.ogStyle) {
    data.ogStyle = "overlay";
  }

  if (Object.keys(data).length === 0) {
    console.log(
      "Delingsbilde-innstillingene er allerede satt — ingen endring."
    );
    process.exit(0);
  }

  await payload.updateGlobal({ slug: "site-settings", data });
  console.log("Ferdig:", Object.keys(data).join(", "));
  process.exit(0);
}

await main();
