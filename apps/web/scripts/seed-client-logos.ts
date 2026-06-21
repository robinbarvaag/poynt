/**
 * Henter kunde-/referanselogoene fra dagens poynt.no (Wix) inn i Payload Media,
 * og kobler dem på `logoCloud`-blokken i Forside-globalen («Noen jeg har jobbet med»).
 *
 * Logoene på poynt.no ligger på mørk bakgrunn og er derfor HVITE/negative. Vår
 * logo-stripe står på den lyse azure-flaten, så de hvite logoene inverteres til
 * mørke (RGB negeres, alpha beholdes → ren mørk silhuett på transparent bunn).
 * `default`-varianten i LogoCloud gråtoner + demper dem uansett, så resultatet
 * blir en rolig, monokrom troverdighets-stripe. Logoer som allerede er mørke
 * (Kitch'n-boksen, Tilbords) lastes inn uendret.
 *
 * Idempotent: et Media-dokument gjenbrukes hvis filnavnet finnes fra før, og
 * blokken pekes alltid på det samme settet — trygt å kjøre på nytt. Vil du
 * bytte ut/re-prosessere en logo: slett Media-dokumentet og kjør på nytt.
 * Finpuss (rekkefølge, fjerne/legge til) gjøres i admin etterpå.
 *
 * NB: `seed-homepage.ts` skriver logoCloud-blokken som ren tekst (uten bilder).
 * Kjør DETTE skriptet ETTER seed-homepage for å legge på bildene – samme mønster
 * som `migrate-images-from-wix.ts` for produkter/tjenester.
 *
 *   bun run --cwd apps/web payload run scripts/seed-client-logos.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import sharp from "sharp";

const UA = "Mozilla/5.0 (compatible; PoyntMigrate/1.0; +https://www.poynt.no)";
const WIX_MEDIA = "https://static.wixstatic.com/media";

// Rekkefølge = visningsrekkefølge i stripa. `invert: true` for hvite/negative
// logoer som må gjøres mørke for den lyse flaten.
const LOGOS: { name: string; slug: string; wixId: string; invert: boolean }[] =
  [
    {
      name: "Vår Energi",
      slug: "var-energi",
      wixId: "23f4c4_d3ee94bea6cd4bb0a861dc7957ec4e7f~mv2.png",
      invert: true,
    },
    {
      name: "Bouvet",
      slug: "bouvet",
      wixId: "23f4c4_0e2a055478c8425ea61b5eecaa01be3a~mv2.png",
      invert: true,
    },
    {
      name: "NOFO",
      slug: "nofo",
      wixId: "23f4c4_ed459b89fee54ff1b6b0bd3cb99724eb~mv2.png",
      invert: true,
    },
    {
      name: "Kitch'n",
      slug: "kitchn",
      wixId: "cf039d_18e84b0fbfa6470aa4df3746404a8951~mv2.png",
      invert: false,
    },
    {
      name: "Tilbords",
      slug: "tilbords",
      wixId: "23f4c4_0cb144bb7e874237b9f206f50dfdfacd~mv2.png",
      invert: false,
    },
    {
      name: "Sopra Steria",
      slug: "sopra-steria",
      wixId: "23f4c4_26fb2e44120147c887293817d8a7b5eb~mv2.png",
      invert: true,
    },
    {
      name: "Stavanger Symfoniorkester",
      slug: "stavanger-symfoniorkester",
      wixId: "23f4c4_884a5bec6c60470dafec5bec9e8c5b00~mv2.png",
      invert: true,
    },
  ];

const payload = await getPayload({ config });

/** Gjenbruker eksisterende Media (etter filnavn) eller laster ned + prosesserer originalen. */
async function ensureLogo(
  logo: (typeof LOGOS)[number]
): Promise<number | undefined> {
  const filename = `logo-${logo.slug}.png`;

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) {
    console.log(`   ↻ gjenbruker ${filename}`);
    return existing.docs[0].id;
  }

  try {
    const res = await fetch(`${WIX_MEDIA}/${logo.wixId}`, {
      headers: { "user-agent": UA },
    });
    if (!res.ok) {
      console.log(`   ⚠️  ${res.status} for ${logo.wixId}`);
      return undefined;
    }
    let buffer = Buffer.from(await res.arrayBuffer());

    // Hvite logoer → inverter RGB (behold alpha) så de blir mørke på lys flate.
    buffer = logo.invert
      ? await sharp(buffer).negate({ alpha: false }).png().toBuffer()
      : await sharp(buffer).png().toBuffer();

    const media = await payload.create({
      collection: "media",
      data: { alt: `${logo.name} – logo` },
      file: {
        data: buffer,
        mimetype: "image/png",
        name: filename,
        size: buffer.length,
      },
    });
    console.log(`   ✅ ${filename}${logo.invert ? " (invertert)" : ""}`);
    return media.id;
  } catch (err) {
    console.log(`   ⚠️  Feilet for ${logo.slug}: ${String(err)}`);
    return undefined;
  }
}

console.log("=== Kunde-logoer → Forside ===");

const logos: { name: string; image: number }[] = [];
for (const logo of LOGOS) {
  const id = await ensureLogo(logo);
  if (id) logos.push({ name: logo.name, image: id });
}

if (logos.length === 0) {
  console.log("⚠️  Ingen logoer hentet – avbryter uten å røre globalen.");
  process.exit(1);
}

// Patch logoCloud-blokken i Forside-globalen med bilderefene (behold alt annet).
const home = await payload.findGlobal({ slug: "homepage", depth: 0 });
// biome-ignore lint/suspicious/noExplicitAny: layout matcher blokk-skjemaet
const layout = (home.layout ?? []) as any[];
const block = layout.find((b) => b?.blockType === "logoCloud");
if (!block) {
  console.log(
    "⚠️  Fant ingen logoCloud-blokk på forsiden. Kjør seed-homepage.ts først."
  );
  process.exit(1);
}
block.logos = logos;

await payload.updateGlobal({
  slug: "homepage",
  // biome-ignore lint/suspicious/noExplicitAny: delvis oppdatering av blokk-skjemaet
  data: { layout } as any,
});

console.log(`\nFerdig: koblet ${logos.length} logoer på forsiden.`);
process.exit(0);
