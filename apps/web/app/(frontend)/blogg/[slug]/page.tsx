import { BlogPostView } from "@/components/views/blog-post-view";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
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
  // Invalideres via cacheTag("cms") ved publisering — se lib/revalidate-cms.ts.
  cacheLife("max");

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

// Kun publisert innhold her — forhåndsvisning av utkast bor på
// /forhandsvisning/blogg/[slug], så denne ruta kan prerendres statisk.
export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
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
