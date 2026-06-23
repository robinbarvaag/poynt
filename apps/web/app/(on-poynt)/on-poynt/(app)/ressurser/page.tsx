import { ArticleSearch } from "@/components/article-search";
import { CategoryFilter } from "@/components/category-filter";
import { PayloadImage } from "@/components/payload-image";
import type { Category, Guide, Media } from "@/payload-types";
import config from "@/payload.config";
import { GuideCard, Heading, Text } from "@poynt/ui";
import { Stagger, StaggerItem } from "@poynt/ui/motion";
import { getPayload } from "payload";

interface PageProps {
  searchParams: Promise<{ kategori?: string; sok?: string }>;
}

const SECTIONS: { value: Guide["section"]; label: string; blurb: string }[] = [
  { value: "kanaler", label: "Kanaler", blurb: "Få mest ut av hver plattform" },
  {
    value: "generelt",
    label: "Generelt",
    blurb: "Grunnmuren i god markedsføring",
  },
  { value: "maler", label: "Maler", blurb: "Ferdige oppsett du kan kopiere" },
  {
    value: "inspirasjon",
    label: "Inspirasjon",
    blurb: "Det som inspirerer akkurat nå",
  },
  {
    value: "ressurser",
    label: "Gratis ressurser",
    blurb: "Last ned og kom i gang",
  },
];

function getCategory(cat: Guide["category"]): Category | null {
  return cat && typeof cat === "object" ? cat : null;
}

function thumbOf(guide: Guide) {
  const cover =
    guide.coverImage && typeof guide.coverImage === "object"
      ? (guide.coverImage as Media)
      : null;
  if (!cover?.url) return undefined;
  return <PayloadImage media={cover} alt={cover.alt || guide.title} fill />;
}

function GuideCardFor({ guide }: { guide: Guide }) {
  const cat = getCategory(guide.category);
  return (
    <GuideCard
      href={`/on-poynt/ressurser/${guide.slug}`}
      title={guide.title}
      lede={guide.lede ?? undefined}
      icon={guide.icon ?? undefined}
      category={cat?.name}
      accentColor={cat?.color ?? undefined}
      thumbnail={thumbOf(guide)}
    />
  );
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const { kategori, sok } = await searchParams;
  const payload = await getPayload({ config });

  const [guidesResult, categoriesResult] = await Promise.all([
    payload.find({
      collection: "guides",
      where: {
        _status: { equals: "published" },
        ...(kategori && { "category.slug": { equals: kategori } }),
        ...(sok && {
          or: [{ title: { like: sok } }, { lede: { like: sok } }],
        }),
      },
      sort: "order",
      depth: 2,
      limit: 200,
    }),
    payload.find({ collection: "categories", limit: 100 }),
  ]);

  const guides = guidesResult.docs;
  const isFiltering = Boolean(kategori || sok);

  const categories = categoriesResult.docs
    .filter((cat) => guides.some((g) => getCategory(g.category)?.id === cat.id))
    .map((cat) => ({
      value: cat.slug,
      label: cat.name,
      color: cat.color ?? undefined,
      icon: cat.icon ?? undefined,
    }));

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <Heading size="h1">Ressurser</Heading>
        <Text variant="muted">
          Guider, maler og inspirasjon for markedsføring og innholdsproduksjon —
          alt samlet på ett sted.
        </Text>
      </header>

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

      {guides.length === 0 ? (
        <Text variant="muted" customStyles="text-center py-12">
          Ingen ressurser funne.
        </Text>
      ) : isFiltering ? (
        <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <StaggerItem key={guide.id}>
              <GuideCardFor guide={guide} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <div className="flex flex-col gap-14">
          {SECTIONS.map((section) => {
            const inSection = guides.filter((g) => g.section === section.value);
            if (inSection.length === 0) return null;
            return (
              <section key={section.value} className="flex flex-col gap-5">
                <div className="flex flex-col gap-0.5">
                  <Heading size="h3">{section.label}</Heading>
                  <Text variant="muted" customStyles="text-sm">
                    {section.blurb}
                  </Text>
                </div>
                <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {inSection.map((guide) => (
                    <StaggerItem key={guide.id}>
                      <GuideCardFor guide={guide} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
