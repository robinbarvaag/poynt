import { ArticleRichText } from "@/components/article-rich-text";
import { PayloadImage } from "@/components/payload-image";
import { extractToc } from "@/lib/extract-toc";
import type { Article, Category, Media, User } from "@/payload-types";
import config from "@/payload.config";
import {
  AuthorByline,
  ContentCard,
  GuideHero,
  ReadingMeta,
  ReadingNav,
  ReadingProgress,
  RelatedContent,
  SectionRail,
  type SectionRailItem,
} from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

type TocNode = {
  type: string;
  tag?: string;
  text?: string;
  children?: TocNode[];
};

function getFirstCategory(article: Article): Category | null {
  const cats = article.categories;
  if (Array.isArray(cats) && cats.length > 0 && typeof cats[0] !== "number") {
    return cats[0] as Category;
  }
  return null;
}

function thumbOf(article: Article) {
  const img =
    article.featuredImage && typeof article.featuredImage === "object"
      ? (article.featuredImage as Media)
      : null;
  if (!img?.url) return undefined;
  return <PayloadImage media={img} alt={img.alt || article.title} fill />;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const articles = await payload.find({
    collection: "articles",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    depth: 2,
    limit: 1,
  });

  if (articles.docs.length === 0) {
    notFound();
  }

  const article = articles.docs[0];
  const cat = getFirstCategory(article);
  const cover =
    article.featuredImage && typeof article.featuredImage === "object"
      ? (article.featuredImage as Media)
      : null;

  const sections: SectionRailItem[] = extractToc(
    article.content as { root: { children: TocNode[] } }
  )
    .filter((item) => item.level === 2)
    .map((item) => ({ id: item.id, label: item.text }));
  const hasRail = sections.length >= 2;

  const author =
    article.author && typeof article.author !== "number"
      ? (article.author as User)
      : null;
  const authorName = author?.firstName || author?.email || "Poynt";

  const publishedDate = new Date(article.publishedAt).toLocaleDateString(
    "nb-NO",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const meta = [
    ...(article.readingTime
      ? [{ icon: "clock" as const, label: `${article.readingTime} min` }]
      : []),
    ...(cat ? [{ icon: "compass" as const, label: cat.name }] : []),
  ];

  const related = (article.relatedArticles ?? []).filter(
    (r): r is Article => typeof r !== "number"
  );

  return (
    <div className="-mx-4 md:-mx-6">
      <ReadingProgress className="hidden lg:block" />
      {hasRail && <ReadingNav items={sections} />}

      <GuideHero
        title={article.title}
        lede={article.excerpt ?? undefined}
        eyebrow={cat?.name}
        accent="saffron"
        cover={
          cover?.url ? (
            <PayloadImage
              media={cover}
              alt={cover.alt || article.title}
              fill
              priority
            />
          ) : undefined
        }
      />

      <div
        className={`mx-auto px-4 md:px-6 ${hasRail ? "max-w-7xl" : "max-w-3xl"}`}
      >
        <div className="-mt-6 relative z-10 mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <AuthorByline name={authorName} date={publishedDate} />
          {meta.length > 0 && <ReadingMeta items={meta} />}
        </div>

        <Link
          href="/on-poynt/artikler"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til artikler</span>
        </Link>

        <div
          className={
            hasRail
              ? "lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14"
              : ""
          }
        >
          {hasRail && (
            <aside className="hidden lg:block">
              <div className="sticky top-10">
                <SectionRail items={sections} />
              </div>
            </aside>
          )}

          <article className="min-w-0 pb-16">
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
              <ArticleRichText data={article.content} />
            </div>

            {related.length > 0 && (
              <RelatedContent title="Relaterte artikler" className="mt-16">
                {related.map((r) => {
                  const rCat = getFirstCategory(r);
                  return (
                    <ContentCard
                      key={r.id}
                      href={`/on-poynt/artikler/${r.slug}`}
                      format="artikkel"
                      title={r.title}
                      lede={r.excerpt ?? undefined}
                      category={rCat?.name}
                      cover={thumbOf(r)}
                    />
                  );
                })}
              </RelatedContent>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
