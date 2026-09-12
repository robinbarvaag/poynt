import { BlogPostView } from "@/components/views/blog-post-view";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

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
//
// Alt innholdet avhenger av `slug`, så params leses her – bak Suspense-grensa
// i default-exporten. Da kan Next servere et umiddelbart skall (Instant
// Navigations med cacheComponents) og strømme inn innlegget.
async function PostPageContent({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    notFound();
  }

  return <BlogPostView post={post} />;
}

export default function PostPage(props: PostPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-5 w-48 rounded-full bg-muted" />
          <div className="mb-8 space-y-4">
            <div className="h-6 w-24 rounded-full bg-muted" />
            <div className="h-10 w-4/5 rounded-2xl bg-muted" />
            <div className="h-5 w-2/3 rounded-full bg-muted" />
            <div className="h-4 w-40 rounded-full bg-muted" />
          </div>
          <div className="mb-8 aspect-[16/9] w-full rounded-3xl bg-muted" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-4 w-full rounded-full bg-muted" />
            <div className="h-4 w-5/6 rounded-full bg-muted" />
            <div className="h-4 w-3/4 rounded-full bg-muted" />
          </div>
        </div>
      }
    >
      <PostPageContent {...props} />
    </Suspense>
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
