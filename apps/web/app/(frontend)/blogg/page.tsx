import { CategoryFilter } from "@/components/category-filter";
import { PageHero } from "@/components/page-hero";
import { getMediaUrl } from "@/lib/media-url";
import config from "@/payload.config";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Container,
  Heading,
  Text,
} from "@poynt/ui";
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
    payload.findGlobal({
      slug: "blogpage" as "homepage",
      depth: 1,
    }) as Promise<unknown> as Promise<BlogPageData>,
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
  const emptyStateText =
    blogPage?.emptyStateText || "Ingen publiserte innlegg ennå.";

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
          <CategoryFilter
            categories={categories}
            paramName="kategori"
            allLabel="Alle"
          />
        )}
      </PageHero>

      <Container padding="default" className="py-8">
        {posts.docs.length === 0 ? (
          <Text variant="muted" customStyles="text-center py-12">
            {emptyStateText}
          </Text>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {posts.docs.map((post, index) => (
              <Link
                key={post.id}
                href={`/post/${post.slug}`}
                className={`group block ${index === 0 && !kategori ? "md:col-span-2 lg:col-span-2" : ""}`}
              >
                {/* Featured Image */}
                <div
                  className={`relative mb-4 overflow-hidden rounded-2xl bg-muted ${index === 0 && !kategori ? "aspect-2/1" : "aspect-video"}`}
                >
                  {post.featuredImage &&
                  typeof post.featuredImage === "object" &&
                  post.featuredImage.url ? (
                    <Image
                      src={post.featuredImage.url}
                      alt={post.featuredImage.alt || post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                        <span className="text-muted-foreground/40 text-lg">
                          B
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Categories */}
                  {post.categories && post.categories.length > 0 && (
                    <div className="flex gap-3">
                      {post.categories.slice(0, 2).map((cat) => {
                        const categoryName =
                          typeof cat === "object" ? cat.name : null;
                        if (!categoryName) return null;
                        const categoryKey =
                          typeof cat === "object" ? cat.id : cat;
                        return (
                          <Text
                            key={categoryKey}
                            type="span"
                            customStyles="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]"
                          >
                            {categoryName}
                          </Text>
                        );
                      })}
                    </div>
                  )}

                  {/* Title */}
                  <Heading
                    variant="h3"
                    size={index === 0 && !kategori ? "display-sm" : undefined}
                    color="foreground"
                    weight="bold"
                    customStyles="leading-snug transition-colors group-hover:text-primary"
                  >
                    {post.title}
                  </Heading>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <Text variant="muted" customStyles="line-clamp-2">
                      {post.excerpt}
                    </Text>
                  )}

                  {/* Author and Date */}
                  <div className="flex items-center gap-2 pt-2">
                    {post.author && typeof post.author === "object" && (
                      <>
                        <Avatar className="h-6 w-6">
                          {post.author.avatar &&
                          typeof post.author.avatar === "object" &&
                          post.author.avatar.url ? (
                            <AvatarImage
                              src={getMediaUrl(post.author.avatar.url)}
                              alt={post.author.firstName || ""}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {post.author.firstName?.[0] ||
                              post.author.email?.[0]?.toUpperCase() ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        <Text type="span" variant="muted">
                          {post.author.firstName || post.author.email}
                        </Text>
                        <span className="text-muted-foreground/50">·</span>
                      </>
                    )}
                    <Text type="span" variant="muted">
                      {formatDate(post.publishedAt)}
                    </Text>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
