/**
 * Henter produkt- og tjenestebilder fra dagens poynt.no (Wix) inn i Payload Media,
 * og kobler dem på riktig Produkt/Tjeneste.
 *
 * PRODUKTER: hver vare har en egen Wix-side (/nettbutikk/<wix-slug>). Sidens JSON
 *   inneholder produktets bildegalleri som `"media":[{id,url,altText,...}]`. Vi
 *   forankrer på `og:image` (Wix sin hovedbilde-peker), finner media-arrayen som
 *   inneholder det bildet, og henter ALLE bildene i rekkefølge. Første bilde blir
 *   `featuredImage`, resten legges i `gallery` (med altText som bildetekst).
 *
 * TJENESTER: har ingen egen detaljside — de er seksjoner på /tjenester med ett
 *   bilde hver. Bilde-ID-ene er stabile, så de er kartlagt direkte under (samme
 *   pragmatiske tilnærming som seed-services.ts).
 *
 * Bildene lastes ned i ORIGINAL full oppløsning (uten Wix sin /v1/...-transform).
 * Idempotent: et Media-dokument gjenbrukes hvis filnavnet finnes fra før, og
 * produkt/tjeneste pekes alltid på det samme settet — trygt å kjøre på nytt.
 * Finpuss (beskjæring/rekkefølge/alt-tekst) gjøres i admin etterpå.
 *
 *   bun run --cwd apps/web payload run scripts/migrate-images-from-wix.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const UA = "Mozilla/5.0 (compatible; PoyntMigrate/1.0; +https://www.poynt.no)";
const WIX_MEDIA = "https://static.wixstatic.com/media";

// Vår produkt-slug → Wix sin detaljside-URL.
const PRODUCT_PAGES: { slug: string; url: string }[] = [
  {
    slug: "verdifull-vekst-i-din-bedrift",
    url: "https://www.poynt.no/nettbutikk/verdifull-vekst",
  },
  {
    slug: "innholdsideer-til-linkedin",
    url: "https://www.poynt.no/nettbutikk/linkedin-innholdsideer",
  },
  {
    slug: "75-innholdsideer-til-instagram",
    url: "https://www.poynt.no/nettbutikk/innholdsideer-instagram",
  },
  {
    slug: "tips-for-a-lykkes-med-pinterest",
    url: "https://www.poynt.no/nettbutikk/pinterest",
  },
  {
    slug: "on-poynt-medlemskap-12-maneder",
    url: "https://www.poynt.no/nettbutikk/medlemskap",
  },
];

// Vår tjeneste-slug → Wix bilde-ID (fra /tjenester).
const SERVICE_IMAGES: { slug: string; wixId: string }[] = [
  {
    slug: "radgiving",
    wixId: "23f4c4_19761409f64e4c69b8bcdfe7bd7abf8d~mv2.jpg",
  },
  { slug: "innholdsproduksjon", wixId: "c6b40877a8d443378894a5f7b31b9c7b.jpg" },
  {
    slug: "workshop-for-styret",
    wixId: "11062b_7c1c96aa5d84413f9622d7e1ad8cf38a~mv2.jpg",
  },
  {
    slug: "kurs-og-foredrag",
    wixId: "23f4c4_a65e2b7911014883ba1cb22dd72352cc~mv2.jpg",
  },
  {
    slug: "medlemskap-i-on-poynt",
    wixId: "23f4c4_87c300d78d064b899f69be98e4d5aea4~mv2.png",
  },
];

interface MediaItem {
  wixId: string;
  alt: string;
}

const payload = await getPayload({ config });

function decode(s: string): string {
  return s
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"')
    .trim();
}

/** Henter og:image-ID-en (Wix sin hovedbilde-peker) fra sidens HTML. */
function ogImageId(html: string): string | undefined {
  const m = html.match(
    /<meta property="og:image" content="https:\/\/static\.wixstatic\.com\/media\/([^/"]+)/
  );
  return m ? decode(m[1]) : undefined;
}

/** Klipper ut det balanserte `[ ... ]`-uttrykket som starter ved `from` (string-aware). */
function balancedArray(html: string, from: number): string {
  let depth = 0;
  let inStr = false;
  for (let i = from; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === "\\") i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return html.slice(from, i + 1);
    }
  }
  return html.slice(from);
}

/**
 * Finner produktets bildegalleri i side-JSON-en. Wix legger det som
 * `"media":[{"id":"..","url":"..","fullUrl":"..","altText":".."},...]`. Vi velger
 * den media-arrayen som inneholder og:image-ID-en (= riktig produkt, ikke kryss-salg),
 * og returnerer bildene i rekkefølge. Faller tilbake til kun og:image hvis arrayen
 * ikke finnes.
 */
function extractGallery(html: string, ogId: string): MediaItem[] {
  // altText kan være en streng ELLER null (Wix sender null når bildet mangler alt).
  const itemRe =
    /\{"id":"([^"]+)","url":"[^"]+","fullUrl":"[^"]*","altText":(?:"([^"]*)"|null)/g;

  let idx = html.indexOf('"media":[');
  while (idx !== -1) {
    const arr = balancedArray(html, idx + '"media":'.length);
    const items: MediaItem[] = [];
    for (const m of arr.matchAll(itemRe)) {
      items.push({ wixId: decode(m[1]), alt: m[2] ? decode(m[2]) : "" });
    }
    if (items.some((it) => it.wixId === ogId)) return items;
    idx = html.indexOf('"media":[', idx + 1);
  }

  return [{ wixId: ogId, alt: "" }];
}

/** Gjenbruker eksisterende Media (etter filnavn) eller laster ned originalen. */
async function ensureMedia(
  wixId: string,
  alt: string
): Promise<number | undefined> {
  // Stabilt filnavn fra Wix-ID-en: 23f4c4_abc~mv2.jpg → 23f4c4_abc.jpg
  const cleanId = wixId.replace(/~mv2/i, "");
  const ext = (cleanId.match(/\.([a-z0-9]+)$/i)?.[1] ?? "jpg").toLowerCase();
  const base = cleanId.replace(/\.[a-z0-9]+$/i, "");
  const filename = `wix-${base}.${ext}`;

  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
    depth: 0,
  });
  if (existing.docs[0]) return existing.docs[0].id;

  try {
    const res = await fetch(`${WIX_MEDIA}/${wixId}`, {
      headers: { "user-agent": UA },
    });
    if (!res.ok) {
      console.log(`   ⚠️  ${res.status} for ${wixId}`);
      return undefined;
    }
    const mimetype =
      res.headers.get("content-type")?.split(";")[0] ?? `image/${ext}`;
    const buffer = Buffer.from(await res.arrayBuffer());
    const media = await payload.create({
      collection: "media",
      data: { alt: alt || filename },
      file: { data: buffer, mimetype, name: filename, size: buffer.length },
    });
    return media.id;
  } catch (err) {
    console.log(`   ⚠️  Nedlasting feilet for ${wixId}: ${String(err)}`);
    return undefined;
  }
}

async function migrateProducts() {
  console.log("\n=== Produkter ===");
  for (const { slug, url } of PRODUCT_PAGES) {
    const found = await payload.find({
      collection: "products",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    if (!found.docs[0]) {
      console.log(`⏭️  Fant ikke produkt: ${slug}`);
      continue;
    }

    let html: string;
    try {
      const res = await fetch(url, { headers: { "user-agent": UA } });
      if (!res.ok) {
        console.log(`⚠️  ${res.status} for ${url}`);
        continue;
      }
      html = await res.text();
    } catch (err) {
      console.log(`⚠️  Klarte ikke hente ${url}: ${String(err)}`);
      continue;
    }

    const ogId = ogImageId(html);
    if (!ogId) {
      console.log(`⚠️  Fant ingen og:image på ${url}`);
      continue;
    }

    const items = extractGallery(html, ogId);
    // Sett hovedbildet (og:image) først.
    items.sort((a, b) => (a.wixId === ogId ? -1 : b.wixId === ogId ? 1 : 0));

    const mediaIds: number[] = [];
    const captions: string[] = [];
    for (const it of items) {
      const id = await ensureMedia(it.wixId, it.alt);
      if (id) {
        mediaIds.push(id);
        captions.push(it.alt);
      }
    }
    if (mediaIds.length === 0) {
      console.log(`⚠️  Ingen bilder hentet for ${slug}`);
      continue;
    }

    const [featured, ...rest] = mediaIds;
    await payload.update({
      collection: "products",
      id: found.docs[0].id,
      data: {
        featuredImage: featured,
        gallery: rest.map((image, i) => ({
          image,
          caption: captions[i + 1] || undefined,
        })),
        // biome-ignore lint/suspicious/noExplicitAny: delvis oppdatering av produkt-skjemaet
      } as any,
    });
    console.log(
      `✅ ${slug}: hovedbilde + ${rest.length} galleribilde${rest.length === 1 ? "" : "r"}`
    );
  }
}

async function migrateServices() {
  console.log("\n=== Tjenester ===");
  for (const { slug, wixId } of SERVICE_IMAGES) {
    const found = await payload.find({
      collection: "services",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    if (!found.docs[0]) {
      console.log(`⏭️  Fant ikke tjeneste: ${slug}`);
      continue;
    }

    const id = await ensureMedia(wixId, `${slug} – poynt.no`);
    if (!id) {
      console.log(`⚠️  Ingen bilde hentet for ${slug}`);
      continue;
    }

    await payload.update({
      collection: "services",
      id: found.docs[0].id,
      // biome-ignore lint/suspicious/noExplicitAny: delvis oppdatering av tjeneste-skjemaet
      data: { image: id } as any,
    });
    console.log(`✅ ${slug}: bilde satt`);
  }
}

await migrateProducts();
await migrateServices();

console.log("\nFerdig med å hente bilder fra poynt.no.");
process.exit(0);
