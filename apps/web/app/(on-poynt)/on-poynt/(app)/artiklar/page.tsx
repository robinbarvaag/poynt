import { ArticleSearch } from "@/components/article-search";
import { CategoryFilter } from "@/components/category-filter";
import { hexToRgba } from "@/lib/color-utils";
import { getMediaUrl } from "@/lib/media-url";
import config from "@/payload.config";
import type { Article, Category, Media } from "@/payload-types";
import { Heading, Text } from "@poynt/ui";
import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getPayload } from "payload";

interface PageProps {
  searchParams: Promise<{ kategori?: string; sok?: string }>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getFirstCategory(
  categories: (number | Category)[] | null | undefined
): Category | null {
  if (!categories || categories.length === 0) return null;
  const cat = categories[0];
  if (typeof cat === "number") return null;
  return cat;
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const { kategori, sok } = await searchParams;
  const payload = await getPayload({ config });

  const [articlesResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: "articles",
      where: {
        _status: { equals: "published" },
        ...(kategori && {
          "categories.slug": { equals: kategori },
        }),
        ...(sok && {
          or: [{ title: { like: sok } }, { excerpt: { like: sok } }],
        }),
      },
      sort: "-publishedAt",
      depth: 2,
    }),
    payload.find({
      collection: "categories",
      limit: 100,
    }),
  ]);

  const allArticles = articlesResult.docs;
  const featuredArticle =
    !kategori && !sok ? (allArticles.find((a) => a.isFeatured) ?? null) : null;
  const gridArticles = featuredArticle
    ? allArticles.filter((a) => a.id !== featuredArticle.id)
    : allArticles;

  const categories = categoriesResult.docs.map((cat) => ({
    value: cat.slug,
    label: cat.name,
    color: cat.color ?? undefined,
    icon: cat.icon ?? undefined,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Heading size="h1">Artiklar</Heading>
        <Text variant="muted" customStyles="mt-1">
          Guider og tips for marknadsføring og innhaldsproduksjon.
        </Text>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-xs">
          <ArticleSearch />
        </div>
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            paramName="kategori"
            allLabel="Alle"
          />
        )}
      </div>

      {featuredArticle && <FeaturedCard article={featuredArticle} />}

      {gridArticles.length === 0 ? (
        <Text variant="muted" customStyles="text-center py-12">
          Ingen artiklar funne.
        </Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  const cat = getFirstCategory(article.categories);
  const catColor = cat?.color ?? null;

  const featuredImage =
    article.featuredImage && typeof article.featuredImage === "object"
      ? (article.featuredImage as Media)
      : null;

  return (
    <Link
      href={`/on-poynt/artiklar/${article.slug}`}
      className="group block rounded-xl overflow-hidden bg-muted"
    >
      <div className="relative aspect-21/9 overflow-hidden">
        {featuredImage?.url ? (
          <Image
            src={getMediaUrl(featuredImage.url)}
            alt={featuredImage.alt || article.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-muted-foreground/10 to-muted-foreground/5" />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

        {catColor && (
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: catColor }}
          />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {cat && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 backdrop-blur-sm"
              style={
                catColor
                  ? {
                      backgroundColor: hexToRgba(catColor, 0.3),
                      color: "white",
                      border: `1px solid ${hexToRgba(catColor, 0.5)}`,
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.15)",
                      color: "white",
                    }
              }
            >
              {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
              {cat.name}
            </span>
          )}

          <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-2 group-hover:text-white/90 transition-colors">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="text-white/75 text-sm line-clamp-2 mb-4 max-w-2xl">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 text-white/50 text-xs">
            {article.readingTime && (
              <>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.readingTime} min lesing
                </span>
                <span>·</span>
              </>
            )}
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const cat = getFirstCategory(article.categories);
  const catColor = cat?.color ?? null;

  const featuredImage =
    article.featuredImage && typeof article.featuredImage === "object"
      ? (article.featuredImage as Media)
      : null;

  return (
    <Link
      href={`/on-poynt/artiklar/${article.slug}`}
      className="group flex flex-col rounded-xl border border-border overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: catColor ?? "var(--border)" }}
      />

      <div className="relative aspect-video bg-muted overflow-hidden shrink-0">
        {featuredImage?.url ? (
          <Image
            src={getMediaUrl(featuredImage.url)}
            alt={featuredImage.alt || article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={catColor ? { backgroundColor: hexToRgba(catColor, 0.06) } : {}}
          />
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        {cat && (
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full w-fit mb-3"
            style={
              catColor
                ? { backgroundColor: hexToRgba(catColor, 0.12), color: catColor }
                : { backgroundColor: "var(--muted)", color: "var(--muted-foreground)" }
            }
          >
            {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
            {cat.name}
          </span>
        )}

        <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors mb-2 flex-1">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto">
          {article.readingTime && (
            <>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min
              </span>
              <span>·</span>
            </>
          )}
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
