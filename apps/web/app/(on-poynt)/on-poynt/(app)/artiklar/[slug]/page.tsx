import { ArticleRichText } from "@/components/article-rich-text";
import { TableOfContents } from "@/components/table-of-contents";
import { extractToc } from "@/lib/extract-toc";
import { getMediaUrl } from "@/lib/media-url";
import config from "@/payload.config";
import { Badge, Card, CardContent, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
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
  const tocItems = extractToc(
    article.content as {
      root: {
        children: {
          type: string;
          tag?: string;
          text?: string;
          children?: unknown[];
        }[];
      };
    }
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
      <Link
        href="/on-poynt/artiklar"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
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
                <div className="flex gap-2 mb-4">
                  {article.categories.map((cat, index) => {
                    const categoryName =
                      typeof cat === "object" ? cat.name : null;
                    if (!categoryName) return null;
                    return (
                      <Badge key={index} variant="accent">
                        {categoryName}
                      </Badge>
                    );
                  })}
                </div>
              )}

            <Heading size="h1">{article.title}</Heading>

            {article.excerpt && <Text variant="lead">{article.excerpt}</Text>}

            <div className="flex items-center gap-4">
              {article.author && typeof article.author === "object" && (
                <Text variant="muted">
                  Av {article.author.firstName || article.author.email}
                </Text>
              )}
              <Text variant="muted">{formatDate(article.publishedAt)}</Text>
            </div>
          </header>

          {article.featuredImage &&
            typeof article.featuredImage === "object" &&
            article.featuredImage.url && (
              <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-10 bg-muted">
                <Image
                  src={getMediaUrl(article.featuredImage.url)}
                  alt={article.featuredImage.alt || article.title}
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
                    if (typeof related !== "object") return null;
                    return (
                      <Link
                        key={related.id}
                        href={`/on-poynt/artiklar/${related.slug}`}
                        className="group"
                      >
                        <Card className="overflow-hidden">
                          {related.featuredImage &&
                            typeof related.featuredImage === "object" &&
                            related.featuredImage.url && (
                              <div className="relative aspect-video bg-muted">
                                <Image
                                  src={getMediaUrl(related.featuredImage.url)}
                                  alt={
                                    related.featuredImage.alt || related.title
                                  }
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                          <CardContent className="p-4">
                            <Text>{related.title}</Text>
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
