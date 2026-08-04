import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { PreviewBanner } from "@/components/preview-banner";
import { ViewTracker } from "@/components/radar/view-tracker";
import { RelatedPosts } from "@/components/related-posts";
import { getDraftBySlug, isDraftModeEnabled } from "@/lib/draft";
import { formatLongDate } from "@/lib/format";
import { resolveMedia, resolveRelations } from "@/lib/payload";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import { articleSchema, breadcrumbSchema } from "@/lib/structured-data";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { BlogPost } from "@/payload-types";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import {
  Badge,
  Breadcrumbs,
  Container,
  DecoBlob,
  Heading,
  Text,
} from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getPost(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  const posts = await payload.find({
    collection: "blog-posts",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    depth: 2,
    limit: 1,
  });

  return posts.docs[0] || null;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return notFoundMetadata("Innlegg ikke funnet");
  }

  return buildMetadata({
    title: post.meta?.title || post.title,
    description: post.meta?.description || post.excerpt || "",
    path: `/blogg/${slug}`,
    // SEO-fanens delingsbilde vinner over hovedbildet når det er satt.
    image: post.meta?.image || post.featuredImage,
    type: "article",
    publishedTime: post.publishedAt,
    noIndex: post.meta?.noIndex ?? undefined,
    canonicalUrl: post.meta?.canonicalUrl,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  // Forhåndsvisning (via /api/preview): les siste utkast i stedet for publisert.
  const isDraft = await isDraftModeEnabled();
  const post = isDraft
    ? await getDraftBySlug("blog-posts", slug)
    : await getPost(slug);
  if (!post) {
    notFound();
  }

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
      {isDraft && <PreviewBanner path={`/blogg/${slug}`} />}
      <ViewTracker
        collection="blog-posts"
        contentId={String(post.id)}
        slug={slug}
      />
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

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const posts = await payload.find({
    collection: "blog-posts",
    where: {
      _status: { equals: "published" },
    },
    limit: 1000,
  });

  return posts.docs.map((post) => ({
    slug: post.slug,
  }));
}
