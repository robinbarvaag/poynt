import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { ViewTracker } from "@/components/radar/view-tracker";
import { RelatedPosts } from "@/components/related-posts";
import { formatLongDate } from "@/lib/format";
import { resolveMedia, resolveRelations } from "@/lib/payload";
import { SITE_URL } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { BlogPost } from "@/payload-types";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Container,
  DecoBlob,
  Heading,
  Text,
} from "@poynt/ui";

/**
 * Delt rendring av et blogginnlegg — brukes både av den offentlige
 * /blogg/[slug]-ruta (publisert, statisk) og /forhandsvisning (utkast).
 * `isDraft` skrur av visnings-sporing så forhåndsvisninger ikke teller.
 */
export function BlogPostView({
  post,
  isDraft = false,
}: {
  post: BlogPost;
  isDraft?: boolean;
}) {
  const slug = post.slug;
  const featuredImage = resolveMedia(post.featuredImage);
  const relatedPosts = resolveRelations<BlogPost>(post.relatedPosts);

  const postUrl = `${SITE_URL}/blogg/${slug}`;
  const jsonLd = [
    articleSchema({
      title: post.title,
      description: post.meta?.description || post.excerpt,
      image: featuredImage,
      url: postUrl,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    }),
    breadcrumbSchema([
      { name: "Hjem", url: SITE_URL },
      { name: "Blogg", url: `${SITE_URL}/blogg` },
      { name: post.title, url: postUrl },
    ]),
  ];

  return (
    <Container size="sm" padding="default">
      <AdminBar
        collection="blog-posts"
        id={String(post.id)}
        singular="innlegg"
      />
      {!isDraft && (
        <ViewTracker
          collection="blog-posts"
          contentId={String(post.id)}
          slug={slug ?? ""}
        />
      )}
      <JsonLd data={jsonLd} />
      <article>
        <Breadcrumbs
          items={detailBreadcrumbs("blogg", post.title)}
          className="mb-8"
        />

        <header className="mb-8">
          {post.categories && post.categories.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {post.categories.map((cat) => {
                const categoryName = typeof cat === "object" ? cat.name : null;
                if (!categoryName) return null;
                const categoryKey = typeof cat === "object" ? cat.id : cat;
                return (
                  <Badge key={categoryKey} variant="soft-saffron">
                    {categoryName}
                  </Badge>
                );
              })}
            </div>
          )}

          <Heading size="h1" color="foreground" weight="bold">
            {post.title}
          </Heading>

          {post.excerpt && (
            <Text variant="lead" customStyles="mt-4">
              {post.excerpt}
            </Text>
          )}

          <div className="mt-6 flex items-center gap-4">
            {post.author && typeof post.author === "object" && (
              <Text variant="muted">Av {post.author.email}</Text>
            )}
            <Text variant="muted">{formatLongDate(post.publishedAt)}</Text>
          </div>
        </header>

        {featuredImage?.url && (
          <div className="relative mb-10">
            {/* Lekent blob-pek bak bildet – same signatur som produktsida */}
            <DecoBlob
              seed={`/blogg/${post.slug}`}
              size={132}
              className="-top-5 -left-5 absolute bg-accent-1 opacity-70 blur-[2px]"
            />
            <div className="relative z-10 aspect-video w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
              <PayloadImage
                media={featuredImage}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover"
                priority
              />
              <MediaCredit media={featuredImage} />
            </div>
          </div>
        )}

        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
          <RichText data={post.content} />
        </div>

        <RelatedPosts posts={relatedPosts} />
      </article>
    </Container>
  );
}
