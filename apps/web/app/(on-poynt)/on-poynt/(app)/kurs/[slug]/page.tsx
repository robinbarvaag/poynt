import { AdminBar } from "@/components/admin-bar";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { CoursePlayer } from "@/components/planner/courses/course-player";
import { ViewTracker } from "@/components/radar/view-tracker";
import { requireFeature } from "@/lib/features/server";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type { Category, Course, Media } from "@/payload-types";
import config from "@/payload.config";
import { type ContentMetaItem, CourseHero } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ leksjon?: string }>;
}

export default async function KursDetailPage({
  params,
  searchParams,
}: CoursePageProps) {
  await requireFeature("laering");
  await requireFeature("kurs");
  const [{ slug }, { leksjon }] = await Promise.all([params, searchParams]);
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "courses",
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

  const course = result.docs[0];

  // Fullførte leksjoner for innlogget medlem — tom liste om noe feiler.
  const trpc = await createServerCaller();
  const completedLessons = await trpc.courseProgress
    .list({ courseSlug: course.slug })
    .catch(() => [] as string[]);

  const modules = course.modules ?? [];
  const lessonKeys = modules.flatMap((mod, mi) =>
    (mod.lessons ?? []).map((_, li) => `m${mi}-l${li}`)
  );
  const lessonCount = lessonKeys.length;

  // To tilstander: uten ?leksjon= vises kursets forside (hero), med ?leksjon=
  // vises spilleren. CTA-en på forsiden tar deg dermed faktisk inn i kurset.
  const inPlayer = Boolean(leksjon) && lessonCount > 0;

  const completedSet = new Set(completedLessons);
  const doneCount = lessonKeys.filter((k) => completedSet.has(k)).length;
  const startKey =
    lessonKeys.find((k) => !completedSet.has(k)) ?? lessonKeys[0];
  const hasProgress = doneCount > 0;

  const cover =
    course.featuredImage && typeof course.featuredImage === "object"
      ? (course.featuredImage as Media)
      : null;

  const firstCat =
    Array.isArray(course.categories) &&
    course.categories.length > 0 &&
    typeof course.categories[0] !== "number"
      ? (course.categories[0] as Category)
      : null;

  const meta: ContentMetaItem[] = [
    { icon: "graduation-cap", label: `${lessonCount} leksjoner` },
    ...(modules.length > 1
      ? [{ icon: "layers" as const, label: `${modules.length} moduler` }]
      : []),
    ...(firstCat ? [{ icon: "compass" as const, label: firstCat.name }] : []),
    ...(hasProgress
      ? [
          {
            icon: "check-circle" as const,
            label: `${doneCount} av ${lessonCount} fullført`,
          },
        ]
      : []),
  ];

  const learn = modules
    .map((mod) => mod.title)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <AdminBar collection="courses" id={String(course.id)} singular="kurs" />
      <ViewTracker
        collection="courses"
        contentId={String(course.id)}
        slug={slug}
      />

      {inPlayer ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/on-poynt/kurs/${slug}`}
              className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <Icon name="arrow-left" className="size-4" />
              {course.title}
            </Link>
          </div>
          <CoursePlayer course={course} initialCompleted={completedLessons} />
        </>
      ) : (
        <>
          <Link
            href="/on-poynt/laering"
            className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <Icon name="arrow-left" className="size-4" />
            Tilbake til Læring
          </Link>
          <CourseHero
            title={course.title}
            lede={course.excerpt ?? undefined}
            meta={meta}
            learn={learn.length > 0 ? learn : undefined}
            ctaLabel={hasProgress ? "Fortsett kurset" : "Start kurset"}
            ctaHref={startKey ? `?leksjon=${startKey}` : "#"}
            cover={
              cover?.url ? (
                <>
                  <PayloadImage
                    media={cover}
                    alt={cover.alt || course.title}
                    fill
                    priority
                  />
                  <MediaCredit media={cover} />
                </>
              ) : undefined
            }
          />
        </>
      )}
    </div>
  );
}
