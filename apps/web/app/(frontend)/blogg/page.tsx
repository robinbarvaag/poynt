import config from "@/payload.config";
import { CategoryFilter } from "@/components/category-filter";
import { PageHero } from "@/components/page-hero";
import { getMediaUrl } from "@/lib/media-url";
import { Avatar, AvatarFallback, AvatarImage, Badge, Card, CardContent, Container, Heading, Text } from "@poynt/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPayload } from "payload";

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

interface PageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const { kategori } = await searchParams;
  const payload = await getPayload({ config });

  const [blogPage, posts, categoriesResult] = await Promise.all([
    payload.findGlobal({ slug: "blogpage" as "homepage", depth: 1 }) as Promise<unknown> as Promise<BlogPageData>,
    payload.find({
      collection: "blog-posts",
      where: {
        _status: { equals: "published" },
        ...(kategori && {
          "categories.slug": { equals: kategori },
        }),
      },
      sort: "-publishedAt",
      depth: 1,
    }),
    payload.find({
      collection: "categories",
      limit: 100,
    }),
  ]);

  const title = blogPage?.title || "Blogg";
  const description = blogPage?.description;
  const emptyStateText = blogPage?.emptyStateText || "Ingen publiserte innlegg ennå.";

  // Build categories with counts
  const categories = categoriesResult.docs.map((cat) => ({
    value: cat.slug,
    label: cat.name,
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <PageHero title={title} description={description} size="large">
        {categories.length > 0 && (
          <div className="mt-8">
            <CategoryFilter
              categories={categories}
              paramName="kategori"
              allLabel="Alle innlegg"
            />
          </div>
        )}
      </PageHero>

      <Container padding="default" className="pt-0">
        {posts.docs.length === 0 ? (
          <Text variant="muted" className="text-center py-12">{emptyStateText}</Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.docs.map((post, index) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className={index === 0 && !kategori ? "md:col-span-2 lg:col-span-2" : ""}
              >
                <Card
                  variant="interactive"
                  padding="none"
                  className="group h-full overflow-hidden"
                >
                  {/* Featured Image */}
                  <div className={`relative bg-muted ${index === 0 && !kategori ? "aspect-[2/1]" : "aspect-video"}`}>
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
                        {post.categories.slice(0, 2).map((cat, catIndex) => {
                          const categoryName = typeof cat === "object" ? cat.name : null;
                          if (!categoryName) return null;
                          return (
                            <Badge key={catIndex} variant="muted" size="sm">
                              {categoryName}
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Title */}
                    <Heading
                      size={index === 0 && !kategori ? "h3" : "h4"}
                      as="h2"
                      className="mb-2 group-hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Heading>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <Text variant="muted" className={`mb-4 ${index === 0 && !kategori ? "line-clamp-3" : "line-clamp-2"}`}>
                        {post.excerpt}
                      </Text>
                    )}

                    {/* Author and Date */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border">
                      {post.author && typeof post.author === "object" && (
                        <>
                          <Avatar className="h-8 w-8">
                            {post.author.avatar && typeof post.author.avatar === "object" && post.author.avatar.url ? (
                              <AvatarImage src={getMediaUrl(post.author.avatar.url)} alt={post.author.firstName || ""} />
                            ) : null}
                            <AvatarFallback className="text-xs">
                              {post.author.firstName?.[0] || post.author.email?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <Text variant="default" className="text-sm font-medium truncate">
                              {post.author.firstName && post.author.lastName
                                ? `${post.author.firstName} ${post.author.lastName}`
                                : post.author.firstName || post.author.email}
                            </Text>
                            <Text variant="subtle" className="text-xs">
                              {formatDate(post.publishedAt)}
                            </Text>
                          </div>
                        </>
                      )}
                      {(!post.author || typeof post.author !== "object") && (
                        <Text variant="subtle" className="text-sm">
                          {formatDate(post.publishedAt)}
                        </Text>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
