import { ArticleRichText } from "@/components/article-rich-text";
import { PayloadImage } from "@/components/payload-image";
import { TableOfContents } from "@/components/table-of-contents";
import { hexToRgba } from "@/lib/color-utils";
import { extractToc } from "@/lib/extract-toc";
import type { Article, Category, Media, User } from "@/payload-types";
import config from "@/payload.config";
import { Card, CardContent, Heading, Text } from "@poynt/ui";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
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

  const firstCat =
    article.categories &&
    Array.isArray(article.categories) &&
    article.categories.length > 0 &&
    typeof article.categories[0] !== "number"
      ? (article.categories[0] as Category)
      : null;
  const catColor = firstCat?.color ?? null;

  type TocNode = {
    type: string;
    tag?: string;
    text?: string;
    children?: TocNode[];
  };
  const tocItems = extractToc(
    article.content as { root: { children: TocNode[] } }
  );
  const hasToc = tocItems.length >= 2;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div>
      {catColor && (
        <div
          className="-mx-6 mb-8 h-1.5"
          style={{ backgroundColor: catColor }}
        />
      )}

      <Link
        href="/on-poynt/artiklar"
        className="mb-8 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Tilbake til artiklar</span>
      </Link>

      <div
        className={hasToc ? "lg:grid lg:grid-cols-[1fr_220px] lg:gap-10" : ""}
      >
        <article>
          <header className="mb-8">
            {article.categories &&
              Array.isArray(article.categories) &&
              article.categories.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {article.categories.map((cat) => {
                    if (typeof cat === "number") return null;
                    const c = cat as Category;
                    return (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={
                          c.color
                            ? {
                                backgroundColor: hexToRgba(c.color, 0.12),
                                color: c.color,
                              }
                            : {
                                backgroundColor: "var(--muted)",
                                color: "var(--muted-foreground)",
                              }
                        }
                      >
                        {c.icon && <span aria-hidden="true">{c.icon}</span>}
                        {c.name}
                      </span>
                    );
                  })}
                </div>
              )}

            <Heading size="h1">{article.title}</Heading>

            {article.excerpt && <Text variant="lead">{article.excerpt}</Text>}

            <div className="flex items-center gap-3 flex-wrap mt-3">
              {article.author && typeof article.author !== "number" && (
                <Text variant="muted">
                  Av{" "}
                  {(article.author as User).firstName ||
                    (article.author as User).email}
                </Text>
              )}
              {article.readingTime && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {article.readingTime} min lesing
                </span>
              )}
              <Text variant="muted">{formatDate(article.publishedAt)}</Text>
            </div>
          </header>

          {article.featuredImage &&
            typeof article.featuredImage !== "number" && (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-10 bg-muted">
                <PayloadImage
                  media={article.featuredImage as Media}
                  alt={(article.featuredImage as Media).alt || article.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}

          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
            <ArticleRichText data={article.content} />
          </div>

          {article.relatedArticles &&
            Array.isArray(article.relatedArticles) &&
            article.relatedArticles.length > 0 && (
              <aside className="mt-16 pt-10 border-t border-border">
                <Heading size="h2">Relaterte artiklar</Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  {article.relatedArticles.map((related) => {
                    if (typeof related === "number") return null;
                    const r = related as Article;
                    return (
                      <Link
                        key={r.id}
                        href={`/on-poynt/artiklar/${r.slug}`}
                        className="group"
                      >
                        <Card className="overflow-hidden">
                          {r.featuredImage &&
                            typeof r.featuredImage !== "number" && (
                              <div className="relative aspect-video bg-muted">
                                <PayloadImage
                                  media={r.featuredImage as Media}
                                  alt={
                                    (r.featuredImage as Media).alt || r.title
                                  }
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                          <CardContent className="p-4">
                            <Text>{r.title}</Text>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </aside>
            )}
        </article>

        {hasToc && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents items={tocItems} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
