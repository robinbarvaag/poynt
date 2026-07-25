import { AdminBar } from "@/components/admin-bar";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { CoursePlayer } from "@/components/planner/courses/course-player";
import { ViewTracker } from "@/components/radar/view-tracker";
import { requireFeature } from "@/lib/features/server";
import type { Category, Course, Media } from "@/payload-types";
import config from "@/payload.config";
import { type ContentMetaItem, CourseHero } from "@poynt/ui";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function KursDetailPage({ params }: CoursePageProps) {
  await requireFeature("laering");
  const { slug } = await params;
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
  const modules = course.modules ?? [];
  const lessonCount = modules.reduce(
    (sum, mod) => sum + (mod.lessons?.length ?? 0),
    0
  );

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
  ];

  const learn = modules
    .map((mod) => mod.title)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <AdminBar collection="courses" id={String(course.id)} singular="kurs" />
      <ViewTracker
        collection="courses"
        contentId={String(course.id)}
        slug={slug}
      />
      <CourseHero
        title={course.title}
        lede={course.excerpt ?? undefined}
        meta={meta}
        learn={learn.length > 0 ? learn : undefined}
        ctaLabel="Start kurset"
        ctaHref="#innhold"
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

      <div id="innhold" className="scroll-mt-6">
        <CoursePlayer course={course} />
      </div>
    </div>
  );
}
