import { AdminBar } from "@/components/admin-bar";
import { GuideBlocks } from "@/components/guides/guide-blocks";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { ViewTracker } from "@/components/radar/view-tracker";
import { extractGuideToc } from "@/lib/extract-guide-toc";
import type { Category, Guide, Media } from "@/payload-types";
import config from "@/payload.config";
import {
  ContentCard,
  GuideHero,
  type GuideHeroAccent,
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

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

const accentBySection: Record<Guide["section"], GuideHeroAccent> = {
  kanaler: "salmon",
  generelt: "mint",
  maler: "saffron",
  inspirasjon: "primary",
  ressurser: "saffron",
};

const sectionLabel: Record<Guide["section"], string> = {
  kanaler: "Kanaler",
  generelt: "Generelt",
  maler: "Maler",
  inspirasjon: "Inspirasjon",
  ressurser: "Gratis ressurser",
};

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

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "guides",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    depth: 2,
    limit: 1,
  });

  if (result.docs.length === 0) {
    notFound();
  }

  const guide = result.docs[0];
  const cat = getCategory(guide.category);
  const cover =
    guide.coverImage && typeof guide.coverImage === "object"
      ? (guide.coverImage as Media)
      : null;

  const sections: SectionRailItem[] = extractGuideToc(guide.content)
    .filter((item) => item.level === 2 || item.level === 3)
    .map((item) => ({
      id: item.id,
      label: item.text,
      level: item.level as 2 | 3,
    }));
  // Innholdsmeny vises kun når partneren har slått den på OG guiden har minst
  // to H2-hovedseksjoner (H3 alene gir ikke en meningsfull meny).
  const h2Count = sections.filter((s) => s.level === 2).length;
  const hasRail = guide.showToc !== false && h2Count >= 2;

  const updated = new Date(guide.updatedAt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const related = (guide.relatedGuides ?? []).filter(
    (r): r is Guide => typeof r !== "number"
  );

  // Content-grid breakout: alt ligger default i den smale `content`-kolonnen
  // (~48rem lesebredde), mens blokker med width=wide/full plasseres i de bredere
  // navngitte kolonnene via `col-[content|wide|full]` i guide-blocks.tsx. Med
  // innholdsmeny (rail) faller wide/full sammen med content — sidemenyen spiser
  // slakken, så det er ikke plass til utbrudd ved siden av.
  const articleCols = hasRail
    ? "[full-start wide-start content-start] minmax(0,48rem) [content-end wide-end full-end] minmax(0,1fr)"
    : "[full-start] minmax(0,1fr) [wide-start] minmax(0,6rem) [content-start] min(48rem,100%) [content-end] minmax(0,6rem) [wide-end] minmax(0,1fr) [full-end]";

  const articleBody = (
    <>
      <div className="-mt-6 relative z-10 col-[content]">
        <ReadingMeta
          items={[
            { icon: "compass", label: sectionLabel[guide.section] },
            { icon: "refresh", label: `Oppdatert ${updated}` },
          ]}
        />
      </div>

      <Link
        href="/on-poynt/ressurser"
        className="col-[content] inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Tilbake til ressurser</span>
      </Link>

      <GuideBlocks blocks={guide.content} />

      {related.length > 0 && (
        <RelatedContent
          title="Relaterte guider"
          className="col-[content] mt-16"
        >
          {related.map((r) => {
            const rCat = getCategory(r.category);
            return (
              <ContentCard
                key={r.id}
                href={`/on-poynt/ressurser/${r.slug}`}
                format="guide"
                title={r.title}
                lede={r.lede ?? undefined}
                category={rCat?.name}
                cover={thumbOf(r)}
              />
            );
          })}
        </RelatedContent>
      )}
    </>
  );

  return (
    <div className="-mx-4 md:-mx-6">
      <AdminBar collection="guides" id={String(guide.id)} singular="guide" />
      <ViewTracker
        collection="guides"
        contentId={String(guide.id)}
        slug={slug}
      />
      <ReadingProgress className="hidden lg:block" />
      {hasRail && <ReadingNav items={sections} />}

      <GuideHero
        title={guide.title}
        lede={guide.lede ?? undefined}
        icon={guide.icon ?? undefined}
        eyebrow={cat?.name}
        accent={accentBySection[guide.section]}
        cover={
          cover?.url ? (
            <>
              <PayloadImage
                media={cover}
                alt={cover.alt || guide.title}
                fill
                priority
              />
              <MediaCredit media={cover} />
            </>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        {hasRail ? (
          <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-14">
            <aside className="hidden lg:block">
              <div className="sticky top-10">
                <SectionRail items={sections} />
              </div>
            </aside>
            <article
              className="grid min-w-0 gap-y-10 pb-16"
              style={{ gridTemplateColumns: articleCols }}
            >
              {articleBody}
            </article>
          </div>
        ) : (
          <article
            className="grid gap-y-10 pb-16"
            style={{ gridTemplateColumns: articleCols }}
          >
            {articleBody}
          </article>
        )}
      </div>
    </div>
  );
}
