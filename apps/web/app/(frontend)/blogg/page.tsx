import { AdminBar } from "@/components/admin-bar";
import { BlogExplorer } from "@/components/blog-explorer";
import { PageHero } from "@/components/page-hero";
import { toBlogCard } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container } from "@poynt/ui";
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
