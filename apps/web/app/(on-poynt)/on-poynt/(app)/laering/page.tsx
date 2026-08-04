import { ArticleSearch } from "@/components/article-search";
import { ChannelFilter } from "@/components/learning/channel-filter";
import { LearningFilter } from "@/components/learning/learning-filter";
import { PayloadImage } from "@/components/payload-image";
import { getFeatureFlags, requireFeature } from "@/lib/features/server";
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
import { Icon, type IconName } from "@poynt/ui/icons";
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

function SectionHeading({
  icon,
  title,
  count,
}: {
  icon: IconName;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon name={icon} className="size-4" />
      </span>
      <h2 className="font-bold font-heading text-xl tracking-tight">{title}</h2>
      <span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs tabular-nums">
        {count}
      </span>
    </div>
  );
}

function CardGrid({ items }: { items: LearningItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
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
  );
}

export default async function LearningPage({ searchParams }: PageProps) {
  await requireFeature("laering");
  const flags = await getFeatureFlags();
  const kursEnabled = flags.kurs;

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
    kursEnabled
      ? payload.find({
          collection: "courses",
          where: { _status: { equals: "published" } },
          sort: "-publishedAt",
          depth: 2,
          limit: 200,
        })
      : Promise.resolve({ docs: [] as Course[] }),
    payload.find({ collection: "categories", limit: 200 }),
  ]);

  const guideItems = guides.docs.map(mapGuide);
  const courseItems = courses.docs.map(mapCourse);
  const items: LearningItem[] = [...guideItems, ...courseItems];

  const typeFilter =
    type && type !== "alt" && (type !== "kurs" || kursEnabled) ? type : null;
  const query = sok?.toLowerCase().trim();

  const matches = (i: LearningItem) => {
    if (kategori && !i.categorySlugs.includes(kategori)) return false;
    if (
      query &&
      !i.title.toLowerCase().includes(query) &&
      !i.lede?.toLowerCase().includes(query)
    ) {
      return false;
    }
    return true;
  };

  const filteredGuides = guideItems.filter(matches);
  const filteredCourses = courseItems.filter(matches);
  const filtered = items
    .filter(matches)
    .filter((i) => !typeFilter || i.format === typeFilter);

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

  const sectionCourses = filteredCourses.filter((i) => i.id !== featured?.id);
  const sectionGuides = filteredGuides.filter((i) => i.id !== featured?.id);
  const flatItems = [...filtered]
    .filter((i) => i.id !== featured?.id)
    .sort((a, b) => b.date - a.date);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Læring"
        description={
          kursEnabled
            ? "Kurs og guider for markedsføring og innholdsproduksjon — alt samlet på ett sted."
            : "Guider for markedsføring og innholdsproduksjon — alt samlet på ett sted."
        }
      />

      <div className="flex flex-col gap-5 rounded-3xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="w-full sm:max-w-sm">
          <ArticleSearch />
        </div>

        {kursEnabled && (
          <div className="flex flex-col gap-2">
            <span className="px-0.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Type
            </span>
            <LearningFilter />
          </div>
        )}

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

          {typeFilter ? (
            // Filtrert på type — én flat liste holder.
            flatItems.length > 0 && <CardGrid items={flatItems} />
          ) : (
            // Uten type-filter: kurs og guider som egne seksjoner.
            <>
              {kursEnabled && sectionCourses.length > 0 && (
                <section className="flex flex-col gap-5">
                  <SectionHeading
                    icon="graduation-cap"
                    title="Kurs"
                    count={sectionCourses.length}
                  />
                  <CardGrid items={sectionCourses} />
                </section>
              )}

              {sectionGuides.length > 0 && (
                <section className="flex flex-col gap-5">
                  {kursEnabled && (
                    <SectionHeading
                      icon="compass"
                      title="Guider"
                      count={sectionGuides.length}
                    />
                  )}
                  <CardGrid items={sectionGuides} />
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
