import { ArticleSearch } from "@/components/article-search";
import { CategoryFilter } from "@/components/category-filter";
import { getMediaUrl } from "@/lib/media-url";
import config from "@/payload.config";
import { Badge, Heading, Text } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";
import { getPayload } from "payload";

interface PageProps {
  searchParams: Promise<{ kategori?: string; sok?: string }>;
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
      depth: 1,
    }),
    payload.find({
      collection: "categories",
      limit: 100,
    }),
  ]);

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
    <div className="flex flex-col gap-8">
      <div>
        <Heading size="h1">Artiklar</Heading>
        <Text variant="muted" className="mt-1">
          Guider og tips for marknadsføring og innhaldsproduksjon.
        </Text>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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

      {articlesResult.docs.length === 0 ? (
        <Text variant="muted" className="text-center py-12">
          Ingen artiklar funne.
        </Text>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {articlesResult.docs.map((article) => (
            <Link
              key={article.id}
              href={`/on-poynt/artiklar/${article.slug}`}
              className="group block"
            >
              <div className="relative bg-muted rounded-lg overflow-hidden mb-4 aspect-video">
                {article.featuredImage &&
                typeof article.featuredImage === "object" &&
                article.featuredImage.url ? (
                  <Image
                    src={getMediaUrl(article.featuredImage.url)}
                    alt={article.featuredImage.alt || article.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
                      <span className="text-muted-foreground/40 text-lg">
                        A
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {article.categories &&
                  Array.isArray(article.categories) &&
                  article.categories.length > 0 && (
                    <div className="flex gap-2">
                      {article.categories.slice(0, 2).map((cat, index) => {
                        const categoryName =
                          typeof cat === "object" ? cat.name : null;
                        if (!categoryName) return null;
                        return (
                          <Badge key={index} variant="secondary">
                            {categoryName}
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                <h2 className="font-medium leading-snug group-hover:text-primary transition-colors">
                  {article.title}
                </h2>

                {article.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                <span className="text-sm text-muted-foreground">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
