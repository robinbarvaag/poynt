import config from "@/payload.config";
import { Badge, Button, Card, CardContent, Container, H1, H2, Lead, Text } from "@poynt/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeft } from "lucide-react";

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

  if (posts.docs.length === 0) {
    return { title: "Innlegg ikke funnet" };
  }

  const post = posts.docs[0];
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: post.meta?.title || post.title,
    description: post.meta?.description || post.excerpt || "",
    alternates: {
      canonical: `${baseUrl}/post/${slug}`,
    },
    openGraph: {
      title: post.meta?.title || post.title,
      description: post.meta?.description || post.excerpt || "",
      url: `${baseUrl}/post/${slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.featuredImage &&
        typeof post.featuredImage === "object" &&
        post.featuredImage.url && {
          images: [{ url: post.featuredImage.url }],
        }),
    },
  };
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

  if (posts.docs.length === 0) {
    notFound();
  }

  const post = posts.docs[0];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Container size="sm" padding="lg">
      <article>
        {/* Back link */}
        <Link
          href="/blogg"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til bloggen</span>
        </Link>

        {/* Header */}
        <header className="mb-8">
          {post.categories && post.categories.length > 0 && (
            <div className="flex gap-2 mb-4">
              {post.categories.map((cat, index) => (
                <Badge key={index} variant="accent">
                  {cat.category}
                </Badge>
              ))}
            </div>
          )}

          <H1 className="mb-4">{post.title}</H1>

          {post.excerpt && (
            <Lead className="mb-6">{post.excerpt}</Lead>
          )}

          <div className="flex items-center gap-4">
            {post.author && typeof post.author === "object" && (
              <Text variant="subtle">Av {post.author.email}</Text>
            )}
            <Text variant="subtle">
              {formatDate(post.publishedAt)}
            </Text>
          </div>
        </header>

        {/* Featured Image */}
        {post.featuredImage &&
          typeof post.featuredImage === "object" &&
          post.featuredImage.url && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-10 bg-muted">
              <Image
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
          <RichText data={post.content} />
        </div>

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <aside className="mt-16 pt-10 border-t border-border">
            <H2 className="mb-8">Relaterte innlegg</H2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.relatedPosts.map((relatedPost) => {
                if (typeof relatedPost !== "object") return null;
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/post/${relatedPost.slug}`}
                    className="group"
                  >
                    <Card variant="interactive" padding="none" className="overflow-hidden">
                      {relatedPost.featuredImage &&
                        typeof relatedPost.featuredImage === "object" &&
                        relatedPost.featuredImage.url && (
                          <div className="relative aspect-video bg-muted">
                            <Image
                              src={relatedPost.featuredImage.url}
                              alt={relatedPost.featuredImage.alt || relatedPost.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                      <CardContent className="p-4">
                        <Text className="font-semibold group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </Text>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </aside>
        )}
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
