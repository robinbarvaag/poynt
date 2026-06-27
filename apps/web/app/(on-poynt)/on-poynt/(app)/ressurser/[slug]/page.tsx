import { GuideBlocks } from "@/components/guides/guide-blocks";
import { PayloadImage } from "@/components/payload-image";
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
    .filter((item) => item.level === 2)
    .map((item) => ({ id: item.id, label: item.text }));
  const hasRail = sections.length >= 2;

  const updated = new Date(guide.updatedAt).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const related = (guide.relatedGuides ?? []).filter(
    (r): r is Guide => typeof r !== "number"
  );

  return (
    <div className="-mx-4 md:-mx-6">
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
            <PayloadImage
              media={cover}
              alt={cover.alt || guide.title}
              fill
              priority
            />
          ) : undefined
        }
      />

      <div
        className={`mx-auto px-4 md:px-6 ${hasRail ? "max-w-7xl" : "max-w-3xl"}`}
      >
        <div className="-mt-6 relative z-10 mb-10">
          <ReadingMeta
            items={[
              { icon: "compass", label: sectionLabel[guide.section] },
              { icon: "refresh", label: `Oppdatert ${updated}` },
            ]}
          />
        </div>

        <Link
          href="/on-poynt/ressurser"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til ressurser</span>
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
            <GuideBlocks blocks={guide.content} />

            {related.length > 0 && (
              <RelatedContent title="Relaterte guider" className="mt-16">
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
          </article>
        </div>
      </div>
    </div>
  );
}
