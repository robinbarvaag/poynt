import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Badge, Card, CardContent, Container, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
    <Container size="sm" padding="default">
      <article>
        <Link
          href="/blogg"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til bloggen</span>
        </Link>

        <header className="mb-8">
          {post.categories && post.categories.length > 0 && (
            <div className="flex gap-2 mb-4">
              {post.categories.map((cat, index) => {
                const categoryName = typeof cat === "object" ? cat.name : null;
                if (!categoryName) return null;
                return (
                  <Badge key={index} variant="accent">
                    {categoryName}
                  </Badge>
                );
              })}
            </div>
          )}

          <Heading size="h1">{post.title}</Heading>

          {post.excerpt && <Text variant="lead">{post.excerpt}</Text>}

          <div className="flex items-center gap-4">
            {post.author && typeof post.author === "object" && (
              <Text variant="muted">Av {post.author.email}</Text>
            )}
            <Text variant="muted">{formatDate(post.publishedAt)}</Text>
          </div>
        </header>

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

        <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
          <RichText data={post.content} />
        </div>

        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <aside className="mt-16 pt-10 border-t border-border">
            <Heading size="h2">Relaterte innlegg</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {post.relatedPosts.map((relatedPost) => {
                if (typeof relatedPost !== "object") return null;
                return (
                  <Link
                    key={relatedPost.id}
                    href={`/post/${relatedPost.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden">
                      {relatedPost.featuredImage &&
                        typeof relatedPost.featuredImage === "object" &&
                        relatedPost.featuredImage.url && (
                          <div className="relative aspect-video bg-muted">
                            <Image
                              src={relatedPost.featuredImage.url}
                              alt={
                                relatedPost.featuredImage.alt ||
                                relatedPost.title
                              }
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                      <CardContent className="p-4">
                        <Text>{relatedPost.title}</Text>
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
