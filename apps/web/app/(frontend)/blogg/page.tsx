import { AdminBar } from "@/components/admin-bar";
import { BlogExplorer } from "@/components/blog-explorer";
import { PageHero } from "@/components/page-hero";
import { collectBlogCategories, toBlogCard } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
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

async function getBlogPageData() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });

  const [blogPage, posts] = await Promise.all([
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
  ]);

  return { blogPage, posts };
}

export async function generateMetadata(): Promise<Metadata> {
  const { blogPage } = await getBlogPageData();

  const meta = blogPage?.meta || {};
  return buildMetadata({
    title: meta.title || blogPage?.title || "Blogg",
    description: meta.description || blogPage?.description,
    path: "/blogg",
    image: meta.image,
    noIndex: meta.noIndex,
  });
}

export default async function BlogPage() {
  const { blogPage, posts } = await getBlogPageData();

  const title = blogPage?.title || "Blogg";
  const description = blogPage?.description;
  const emptyStateText =
    blogPage?.emptyStateText || "Ingen publiserte innlegg ennå.";

  const categories = collectBlogCategories(posts.docs);
  const items = posts.docs.map(toBlogCard);

  return (
    <>
      <AdminBar global="blogpage" singular="bloggside" />
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
