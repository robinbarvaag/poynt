import {
  BlogExplorer,
  type BlogExplorerPost,
} from "@/components/blog-explorer";
import { PageHero } from "@/components/page-hero";
import { PayloadImage } from "@/components/payload-image";
import type { Category } from "@/payload-types";
import config from "@/payload.config";
import { Avatar, AvatarFallback, AvatarImage, Container } from "@poynt/ui";
import type { Metadata } from "next";
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

export default async function BlogPage() {
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
      },
      sort: "-publishedAt",
      depth: 1,
      limit: 200,
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

  const categories = categoriesResult.docs.map((cat) => ({
    value: cat.slug,
    label: cat.name,
  }));

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const items: BlogExplorerPost[] = posts.docs.map((post) => {
    const cats = (post.categories ?? []).filter(
      (cat): cat is Category => typeof cat === "object" && cat !== null
    );
    const categorySlugs = cats
      .map((cat) => cat.slug)
      .filter((slug): slug is string => Boolean(slug));
    const media =
      post.featuredImage && typeof post.featuredImage === "object"
        ? post.featuredImage
        : null;
    const author =
      post.author && typeof post.author === "object" ? post.author : null;
    const authorName = author?.firstName || author?.email || undefined;
    const authorAvatarUrl =
      author?.avatar && typeof author.avatar === "object"
        ? author.avatar.url
        : null;

    return {
      id: post.id,
      href: `/post/${post.slug}`,
      title: post.title,
      excerpt: post.excerpt ?? undefined,
      category: cats[0]?.name,
      date: formatDate(post.publishedAt),
      authorName,
      authorAvatar: author ? (
        <Avatar className="size-6 ring-1 ring-current/10">
          {authorAvatarUrl ? (
            <AvatarImage src={authorAvatarUrl} alt={authorName || ""} />
          ) : null}
          <AvatarFallback className="text-xs">
            {(authorName?.[0] || "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : undefined,
      image: media?.url ? (
        <PayloadImage
          media={media}
          alt={media.alt || post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover/post:scale-[1.03]"
        />
      ) : undefined,
      categorySlugs,
      search: `${post.title} ${post.excerpt ?? ""}`.toLowerCase(),
    };
  });

  return (
    <>
      <PageHero title={title} description={description} size="large" />

      <Container padding="default" className="py-8">
        <BlogExplorer
          posts={items}
          categories={categories}
          emptyStateText={emptyStateText}
        />
      </Container>
    </>
  );
}
