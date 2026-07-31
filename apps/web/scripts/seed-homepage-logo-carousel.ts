/**
 * Bytter logo-stripa på Forside-globalen fra den statiske `logoCloud`-blokken
 * til en `carousel` med kontinuerlig scrolling (`autoScroll`). Logoene og
 * ledeteksten flyttes over som de er — ingen media lastes ned på nytt.
 *
 * Karusellen gjentar lista selv til den er lang nok til å gå sømløst i ring,
 * så sju logoer holder. Dublettene er skjult for skjermlesere.
 *
 * Idempotent: er byttet gjort fra før, oppdateres karusellen på plass.
 * Reversibelt: `logoCloud`-blokken finnes fortsatt i kodebasen, så du kan
 * bytte tilbake i admin ved å legge inn blokken på nytt.
 *
 *   bun run --cwd apps/web payload run scripts/seed-homepage-logo-carousel.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const BLOCK_NAME = "Kundelogoer";

const payload = await getPayload({ config });

console.log("=== Logo-stripe → karusell på forsida ===");

const home = await payload.findGlobal({ slug: "homepage", depth: 0 });
// biome-ignore lint/suspicious/noExplicitAny: layout matcher blokk-skjemaet
const layout = (home.layout ?? []) as any[];

const cloudIndex = layout.findIndex(
  (block) => block?.blockType === "logoCloud"
);
const existingIndex = layout.findIndex(
  (block) => block?.blockType === "carousel" && block?.blockName === BLOCK_NAME
);

if (cloudIndex < 0 && existingIndex < 0) {
  console.log("⚠️  Fant verken logoCloud- eller logo-karusell-blokk. Avbryter.");
  process.exit(1);
}

// Kilden er logoCloud hvis den fortsatt står der, ellers karusellen selv
// (så skriptet kan kjøres på nytt uten å miste logoene).
const source = cloudIndex >= 0 ? layout[cloudIndex] : layout[existingIndex];

/**
 * Finner logo-bildet i Media når blokken ikke har en kobling. `seed-homepage.ts`
 * skriver logoCloud som ren tekst, så kjøres den etter `seed-client-logos.ts`
 * mister logoene bildene sine — og stripa faller tilbake på tekst-wordmarks.
 * Her henter vi dem tilbake via alt-teksten `«Navn – logo»` som seed-skriptet
 * setter, slik at rekkefølgen på skript-kjøringene ikke lenger spiller noen rolle.
 */
async function findLogoImage(name: string): Promise<number | undefined> {
  const media = await payload.find({
    collection: "media",
    where: { alt: { equals: `${name} – logo` } },
    limit: 1,
    depth: 0,
  });
  return media.docs[0]?.id;
}

// biome-ignore lint/suspicious/noExplicitAny: blokk-skjemaet
const sourceItems: any[] =
  cloudIndex >= 0 ? (source.logos ?? []) : (source.slides ?? []);

const slides: { kind: string; title: string; image?: number }[] = [];
for (const entry of sourceItems) {
  const title = entry.name ?? entry.title;
  const image = entry.image ?? (await findLogoImage(title));
  if (!image) console.log(`   ⚠️  fant ikke logo-bilde for «${title}»`);
  slides.push({ kind: "logo", title, image: image ?? undefined });
}

if (slides.length === 0) {
  console.log("⚠️  Ingen logoer å flytte over. Avbryter uten å røre layouten.");
  process.exit(1);
}

const carousel = {
  blockType: "carousel",
  blockName: BLOCK_NAME,
  eyebrow: cloudIndex >= 0 ? (source.label ?? undefined) : source.eyebrow,
  slides,
  effect: "none",
  slidesPerView: "5",
  aspect: "auto",
  autoScroll: true,
  autoplaySeconds: 0,
  loop: true,
  showArrows: false,
  showDots: false,
};

if (cloudIndex >= 0) {
  // Bytt ut på samme plass, så resten av sidens rytme er uendret.
  layout.splice(cloudIndex, 1, carousel);
  // Lå det allerede en logo-karusell et annet sted, er den nå en dublett.
  if (existingIndex >= 0) {
    const stale = layout.findIndex(
      (block, i) =>
        i !== cloudIndex &&
        block?.blockType === "carousel" &&
        block?.blockName === BLOCK_NAME
    );
    if (stale >= 0) layout.splice(stale, 1);
  }
  console.log(`   ✅ erstattet logoCloud på plass ${cloudIndex}`);
} else {
  layout[existingIndex] = { ...carousel, id: layout[existingIndex].id };
  console.log(`   ↻ oppdaterte logo-karusellen på plass ${existingIndex}`);
}

await payload.updateGlobal({
  slug: "homepage",
  // biome-ignore lint/suspicious/noExplicitAny: delvis oppdatering av blokk-skjemaet
  data: { layout } as any,
});

console.log(`\nFerdig: ${slides.length} logoer i en kontinuerlig stripe.`);
for (const slide of slides) console.log(`   • ${slide.title}`);
process.exit(0);
