import { ArticleSearch } from "@/components/article-search";
import { ChannelFilter } from "@/components/learning/channel-filter";
import { LearningFilter } from "@/components/learning/learning-filter";
import { PayloadImage } from "@/components/payload-image";
import type { Category, Course, Guide, Media } from "@/payload-types";
import config from "@/payload.config";
import {
  ContentCard,
  ContentFeature,
  type ContentFormat,
  type ContentMetaItem,
  EmptyState,
  PageHeader,
} from "@poynt/ui";
import { getPayload } from "payload";
import type { ReactNode } from "react";

interface PageProps {
  searchParams: Promise<{ type?: string; kategori?: string; sok?: string }>;
}

interface LearningItem {
  id: string;
  format: ContentFormat;
  href: string;
  title: string;
  lede?: string;
  cover?: ReactNode;
  category?: string;
  categorySlugs: string[];
  date: number;
  meta?: ContentMetaItem[];
  isFeatured: boolean;
}

function coverNode(media: unknown, title: string): ReactNode {
  if (media && typeof media === "object" && "url" in media) {
    const m = media as Media;
    if (m.url) return <PayloadImage media={m} alt={m.alt || title} fill />;
  }
  return undefined;
}

function catObjects(
  rel: (number | Category)[] | number | Category | null | undefined
): Category[] {
  if (!rel) return [];
  const arr = Array.isArray(rel) ? rel : [rel];
  return arr.filter((c): c is Category => typeof c === "object");
}

function mapGuide(g: Guide): LearningItem {
  const cats = catObjects(g.category);
  return {
    id: `guide-${g.id}`,
    format: "guide",
    href: `/on-poynt/ressurser/${g.slug}`,
    title: g.title,
    lede: g.lede ?? undefined,
    cover: coverNode(g.coverImage, g.title),
    category: cats[0]?.name,
    categorySlugs: cats.map((c) => c.slug).filter(Boolean),
    date: new Date(g.updatedAt).getTime(),
    isFeatured: Boolean(g.isFeatured),
  };
}

function mapCourse(c: Course): LearningItem {
  const cats = catObjects(c.categories);
  const lessonCount = (c.modules ?? []).reduce(
    (sum, m) => sum + (m.lessons?.length ?? 0),
    0
  );
  return {
    id: `kurs-${c.id}`,
    format: "kurs",
    href: `/on-poynt/kurs/${c.slug}`,
    title: c.title,
    lede: c.excerpt ?? undefined,
    cover: coverNode(c.featuredImage, c.title),
    category: cats[0]?.name,
    categorySlugs: cats.map((cat) => cat.slug).filter(Boolean),
    date: new Date(c.publishedAt).getTime(),
    meta: [{ icon: "graduation-cap", label: `${lessonCount} leksjoner` }],
    isFeatured: Boolean(c.isFeatured),
  };
}

export default async function LearningPage({ searchParams }: PageProps) {
  const { type, kategori, sok } = await searchParams;
  const payload = await getPayload({ config });

  const [guides, courses, cats] = await Promise.all([
    payload.find({
      collection: "guides",
      where: { _status: { equals: "published" } },
      sort: "order",
      depth: 2,
      limit: 200,
    }),
    payload.find({
      collection: "courses",
      where: { _status: { equals: "published" } },
      sort: "-publishedAt",
      depth: 2,
      limit: 200,
    }),
    payload.find({ collection: "categories", limit: 200 }),
  ]);

  const items: LearningItem[] = [
    ...guides.docs.map(mapGuide),
    ...courses.docs.map(mapCourse),
  ];

  const typeFilter = type && type !== "alt" ? type : null;
  const query = sok?.toLowerCase().trim();

  let filtered = items;
  if (typeFilter) filtered = filtered.filter((i) => i.format === typeFilter);
  if (kategori)
    filtered = filtered.filter((i) => i.categorySlugs.includes(kategori));
  if (query)
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(query) ||
        i.lede?.toLowerCase().includes(query)
    );

  const isFiltering = Boolean(typeFilter || kategori || query);

  // Kanal-filteret bygges fra de kategoriene som faktisk er i bruk.
  const usedSlugs = new Set(items.flatMap((i) => i.categorySlugs));
  const categories = cats.docs
    .filter((c) => usedSlugs.has(c.slug))
    .map((c) => ({
      value: c.slug,
      label: c.name,
      color: c.color ?? undefined,
      icon: c.icon ?? undefined,
    }));

  const featured = !isFiltering
    ? (filtered.find((i) => i.isFeatured) ??
      [...filtered].sort((a, b) => b.date - a.date)[0] ??
      null)
    : null;
  const gridItems = [...filtered]
    .filter((i) => i.id !== featured?.id)
    .sort((a, b) => b.date - a.date);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Læring"
        description="Guider og kurs for markedsføring og innholdsproduksjon — alt samlet på ett sted."
      />

      <div className="flex flex-col gap-5 rounded-3xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="w-full sm:max-w-sm">
          <ArticleSearch />
        </div>

        <div className="flex flex-col gap-2">
          <span className="px-0.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Type
          </span>
          <LearningFilter />
        </div>

        {categories.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="px-0.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Kanal
            </span>
            <ChannelFilter channels={categories} />
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="compass"
          title="Ingen treff"
          description="Vi fant ingenting som matcher filteret eller søket ditt. Prøv et annet søkeord, kanal eller format."
          action={
            <a
              href="/on-poynt/laering"
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm"
            >
              Nullstill
            </a>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          {featured && (
            <ContentFeature
              href={featured.href}
              format={featured.format}
              eyebrow="Plukket ut nå"
              title={featured.title}
              lede={featured.lede}
              cover={featured.cover}
              meta={featured.meta}
            />
          )}

          {gridItems.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridItems.map((item) => (
                <ContentCard
                  key={item.id}
                  href={item.href}
                  format={item.format}
                  title={item.title}
                  lede={item.lede}
                  category={item.category}
                  cover={item.cover}
                  meta={item.meta}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
