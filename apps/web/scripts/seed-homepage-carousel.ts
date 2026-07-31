/**
 * Legger en «Fra bloggen»-karusell på Forside-globalen — den første bruken av
 * den nye `carousel`-blokken. Innholdet hentes fra de nyeste publiserte
 * blogginnleggene som faktisk har et hovedbilde, med parallax-effekt.
 *
 * Idempotent: finnes karusellen fra før (samme blokknavn) oppdateres den på
 * plass i stedet for at det legges til en ny. Resten av layouten røres ikke.
 * Rekkefølge og tekst kan finpusses i admin etterpå — kjører du skriptet på
 * nytt skrives elementene over igjen.
 *
 *   bun run --cwd apps/web payload run scripts/seed-homepage-carousel.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const BLOCK_NAME = "Fra bloggen";
const MAX_SLIDES = 6;

const payload = await getPayload({ config });

console.log("=== «Fra bloggen»-karusell → Forside ===");

const posts = await payload.find({
  collection: "blog-posts",
  where: { _status: { equals: "published" } },
  sort: "-publishedAt",
  limit: 20,
  depth: 0,
});

const slides = posts.docs
  .filter((post) => typeof post.featuredImage === "number")
  .slice(0, MAX_SLIDES)
  .map((post) => ({
    kind: "image",
    image: post.featuredImage,
    eyebrow: "Blogg",
    title: post.title,
    text: post.excerpt ?? undefined,
    href: `/blogg/${post.slug}`,
  }));

if (slides.length === 0) {
  console.log("⚠️  Fant ingen publiserte innlegg med hovedbilde – avbryter.");
  process.exit(1);
}

const carousel = {
  blockType: "carousel",
  blockName: BLOCK_NAME,
  eyebrow: "Les mer",
  title: "Fra bloggen",
  intro:
    "Konkrete tips om markedsføring, innhold og AI — skrevet for deg som gjør jobben selv.",
  slides,
  // Innleggene har både tittel og ingress → kortet, ikke tekst oppå bildet.
  presentation: "card",
  effect: "parallax",
  slidesPerView: "3",
  aspect: "video",
  autoScroll: false,
  autoplaySeconds: 0,
  loop: true,
  showArrows: true,
  showDots: true,
};

const home = await payload.findGlobal({ slug: "homepage", depth: 0 });
// biome-ignore lint/suspicious/noExplicitAny: layout matcher blokk-skjemaet
const layout = (home.layout ?? []) as any[];

const existingIndex = layout.findIndex(
  (block) => block?.blockType === "carousel" && block?.blockName === BLOCK_NAME
);

if (existingIndex >= 0) {
  // Behold id-en så Payload oppdaterer raden i stedet for å bytte den ut.
  layout[existingIndex] = { ...carousel, id: layout[existingIndex].id };
  console.log(`   ↻ oppdaterer eksisterende karusell (plass ${existingIndex})`);
} else {
  // Rett før nyhetsbrevet: etter podkasten, før den avsluttende oppfordringen.
  const newsletterIndex = layout.findIndex(
    (block) => block?.blockType === "newsletter"
  );
  const at = newsletterIndex >= 0 ? newsletterIndex : layout.length;
  layout.splice(at, 0, carousel);
  console.log(`   ✅ setter inn karusell på plass ${at}`);
}

await payload.updateGlobal({
  slug: "homepage",
  // biome-ignore lint/suspicious/noExplicitAny: delvis oppdatering av blokk-skjemaet
  data: { layout } as any,
});

console.log(`\nFerdig: ${slides.length} innlegg i karusellen.`);
for (const slide of slides) console.log(`   • ${slide.title}`);
process.exit(0);
