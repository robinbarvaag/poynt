import config from "@/payload.config";
import { Badge, Card, CardContent, Container, H1, Heading, Lead, Text } from "@poynt/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPayload } from "payload";

const categoryLabels: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  markedsforing: "Markedsføring",
  "sosiale-medier": "Sosiale medier",
  tips: "Tips & triks",
};

interface BlogPageData {
  title?: string;
  description?: string;
  emptyStateText?: string;
  meta?: {
    title?: string;
    description?: string;
    image?: { url?: string } | string;
    noIndex?: boolean;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const blogPage = (await payload.findGlobal({
    slug: "blogpage" as "homepage",
    depth: 1,
  })) as unknown as BlogPageData;

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const meta = blogPage?.meta || {};
  const title = meta.title || blogPage?.title || "Blogg";
  const description = meta.description || blogPage?.description || "";

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/blogg`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/blogg`,
      type: "website",
      ...(meta.image &&
        typeof meta.image === "object" &&
        meta.image.url && {
          images: [{ url: meta.image.url }],
        }),
    },
    ...(meta.noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export default async function BlogPage() {
  const payload = await getPayload({ config });

  const [blogPage, posts] = await Promise.all([
    payload.findGlobal({ slug: "blogpage" as "homepage", depth: 1 }) as Promise<unknown> as Promise<BlogPageData>,
    payload.find({
      collection: "blog-posts",
      where: {
        _status: { equals: "published" },
      },
      sort: "-publishedAt",
      depth: 1,
    }),
  ]);

  const title = blogPage?.title || "Blogg";
  const description = blogPage?.description;
  const emptyStateText = blogPage?.emptyStateText || "Ingen publiserte innlegg ennå.";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Container padding="lg">
      <header className="mb-12 text-center">
        <H1 className="mb-4">{title}</H1>
        {description && <Lead>{description}</Lead>}
      </header>

      {posts.docs.length === 0 ? (
        <Text variant="muted" className="text-center">{emptyStateText}</Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.docs.map((post) => (
            <Link key={post.id} href={`/post/${post.slug}`} className="group">
              <Card variant="interactive" padding="none" className="h-full overflow-hidden">
                {/* Featured Image */}
                <div className="relative aspect-video bg-muted">
                  {post.featuredImage &&
                  typeof post.featuredImage === "object" &&
                  post.featuredImage.url ? (
                    <Image
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-12 h-12 text-muted-foreground/30"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                <CardContent className="p-6">
                  {/* Categories */}
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {post.categories.slice(0, 2).map((cat, index) => (
                        <Badge key={index} variant="muted" size="sm">
                          {categoryLabels[cat.category || ""] || cat.category}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Title */}
                  <Heading size="h4" as="h2" className="mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </Heading>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <Text variant="muted" className="line-clamp-2 mb-3">
                      {post.excerpt}
                    </Text>
                  )}

                  {/* Date */}
                  <Text variant="subtle">
                    {formatDate(post.publishedAt)}
                  </Text>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
