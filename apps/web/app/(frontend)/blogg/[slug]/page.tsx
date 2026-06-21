import { PayloadImage } from "@/components/payload-image";
import { RelatedPosts } from "@/components/related-posts";
import { formatLongDate } from "@/lib/format";
import { resolveMedia, resolveRelations } from "@/lib/payload";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import { detailBreadcrumbs } from "@/lib/ui-text";
import type { BlogPost } from "@/payload-types";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Badge, Breadcrumbs, Container, Heading, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const posts = await payload.find({
    collection: "blog-posts",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    limit: 1,
  });

  const post = posts.docs[0];
  if (!post) {
    return notFoundMetadata("Innlegg ikke funnet");
  }

  return buildMetadata({
    title: post.meta?.title || post.title,
    description: post.meta?.description || post.excerpt || "",
    path: `/blogg/${slug}`,
    image: post.featuredImage,
    type: "article",
    publishedTime: post.publishedAt,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
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

  const post = posts.docs[0];
  if (!post) {
    notFound();
  }

  const featuredImage = resolveMedia(post.featuredImage);
  const relatedPosts = resolveRelations<BlogPost>(post.relatedPosts);

  return (
    <Container size="sm" padding="default">
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
            <span
              aria-hidden="true"
              className="-top-5 -left-5 absolute size-32 rounded-[58%_42%_55%_45%/55%_48%_52%_45%] bg-saffron opacity-70 blur-[2px]"
            />
            <div className="relative z-10 aspect-video w-full overflow-hidden rounded-3xl bg-muted shadow-sm">
              <PayloadImage
                media={featuredImage}
                alt={featuredImage.alt || post.title}
                fill
                className="object-cover"
                priority
              />
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
