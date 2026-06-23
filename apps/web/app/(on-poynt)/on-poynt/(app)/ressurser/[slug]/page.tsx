import { GuideBlocks } from "@/components/guides/guide-blocks";
import { PayloadImage } from "@/components/payload-image";
import { TableOfContents } from "@/components/table-of-contents";
import { extractGuideToc } from "@/lib/extract-guide-toc";
import type { Category, Guide, Media } from "@/payload-types";
import config from "@/payload.config";
import { GuideCard, GuideHero, type GuideHeroAccent, Heading } from "@poynt/ui";
import { Stagger, StaggerItem } from "@poynt/ui/motion";
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

function getCategory(cat: Guide["category"]): Category | null {
  return cat && typeof cat === "object" ? cat : null;
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

  const tocItems = extractGuideToc(guide.content);
  const hasToc = tocItems.length >= 2;

  return (
    <div className="-mx-4 md:-mx-6">
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

      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <Link
          href="/on-poynt/ressurser"
          className="mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tilbake til ressurser</span>
        </Link>

        <div
          className={hasToc ? "lg:grid lg:grid-cols-[1fr_220px] lg:gap-10" : ""}
        >
          <article className="min-w-0">
            <GuideBlocks blocks={guide.content} />

            {guide.relatedGuides &&
              Array.isArray(guide.relatedGuides) &&
              guide.relatedGuides.length > 0 && (
                <aside className="mt-16 border-t border-border pt-10">
                  <Heading size="h2">Relaterte guider</Heading>
                  <Stagger className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {guide.relatedGuides.map((related) => {
                      if (typeof related === "number") return null;
                      const r = related as Guide;
                      const rCover =
                        r.coverImage && typeof r.coverImage === "object"
                          ? (r.coverImage as Media)
                          : null;
                      const rCat = getCategory(r.category);
                      return (
                        <StaggerItem key={r.id}>
                          <GuideCard
                            href={`/on-poynt/ressurser/${r.slug}`}
                            title={r.title}
                            lede={r.lede ?? undefined}
                            icon={r.icon ?? undefined}
                            category={rCat?.name}
                            accentColor={rCat?.color ?? undefined}
                            thumbnail={
                              rCover?.url ? (
                                <PayloadImage
                                  media={rCover}
                                  alt={rCover.alt || r.title}
                                  fill
                                />
                              ) : undefined
                            }
                          />
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
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
    </div>
  );
}
