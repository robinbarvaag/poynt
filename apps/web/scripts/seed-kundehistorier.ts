/**
 * Flytter kundehistorier fra bloggen til den dedikerte case-studies-
 * collectionen («Kundehistorier» i admin). Historiene er tidløst salgsbevis
 * med egne URL-er (/kundehistorier/[slug]) — bloggen er fag/aktualitet.
 *
 * For hver slug i STORIES: kopierer tittel/utdrag/bilde/innhold fra
 * blogginnlegget til en kundehistorie (upsert på slug) og setter
 * blogginnlegget til kladd. Rydder også bort den midlertidige
 * «Kundehistorier»-bloggkategorien fra første iterasjon. Idempotent.
 *
 *   bun run --cwd apps/web payload run scripts/seed-kundehistorier.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

// Blogg-slug → case-metadata. Nye historier skrives rett i admin
// (Innhold → Kundehistorier); denne lista er kun for flytting fra bloggen.
const STORIES = [
  {
    blogSlug: "hageland-edens-have-nadde-malene-sine-med-on-poynt",
    customer: "Hageland Edens Have",
  },
];

const payload = await getPayload({ config });

for (const story of STORIES) {
  const posts = await payload.find({
    collection: "blog-posts",
    where: { slug: { equals: story.blogSlug } },
    limit: 1,
    depth: 0,
  });
  const post = posts.docs[0];

  const existing = await payload.find({
    collection: "case-studies",
    where: { slug: { equals: story.blogSlug } },
    limit: 1,
    depth: 0,
  });

  if (!post && existing.docs.length === 0) {
    payload.logger.warn(
      `Fant verken blogginnlegg eller kundehistorie for «${story.blogSlug}» — hoppet over.`
    );
    continue;
  }

  if (post) {
    const data = {
      title: post.title,
      slug: post.slug,
      customer: story.customer,
      excerpt: post.excerpt ?? undefined,
      featuredImage:
        typeof post.featuredImage === "object"
          ? post.featuredImage?.id
          : post.featuredImage,
      content: post.content,
      publishedAt: post.publishedAt,
      _status: "published" as const,
    };

    if (existing.docs.length > 0) {
      await payload.update({
        collection: "case-studies",
        id: existing.docs[0].id,
        // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher skjemaet
        data: data as any,
      });
      payload.logger.info(
        `Oppdaterte kundehistorie: /kundehistorier/${post.slug}`
      );
    } else {
      await payload.create({
        collection: "case-studies",
        // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher skjemaet
        data: data as any,
      });
      payload.logger.info(
        `Opprettet kundehistorie: /kundehistorier/${post.slug}`
      );
    }

    // Historien bor nå i case-studies — avpubliser blogg-utgaven.
    if (post._status === "published") {
      await payload.update({
        collection: "blog-posts",
        id: post.id,
        data: { _status: "draft", categories: [] },
      });
      payload.logger.info(`Satte blogginnlegg til kladd: /blogg/${post.slug}`);
    }
  }
}

// Rydd bort den midlertidige blogg-kategorien fra første iterasjon.
const oldCategory = await payload.find({
  collection: "categories",
  where: { slug: { equals: "kundehistorier" } },
  limit: 1,
  depth: 0,
});
if (oldCategory.docs.length > 0) {
  await payload.delete({
    collection: "categories",
    id: oldCategory.docs[0].id,
  });
  payload.logger.info("Slettet utdatert bloggkategori «Kundehistorier».");
}

payload.logger.info("Ferdig med å seede kundehistorier.");
process.exit(0);
