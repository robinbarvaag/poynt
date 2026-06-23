import { PayloadImage } from "@/components/payload-image";
import type { Course, Media } from "@/payload-types";
import config from "@/payload.config";
import { Card, CardContent, PageHeader } from "@poynt/ui";
import Link from "next/link";
import { getPayload } from "payload";

export const metadata = {
  title: "Kurs",
};

function countLessons(modules: Course["modules"]): number {
  return (modules ?? []).reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);
}

export default async function KursPage() {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "courses",
    where: { _status: { equals: "published" } },
    sort: "-publishedAt",
    depth: 1,
    limit: 100,
  });
  const courses = result.docs;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kurs"
        description="Lær i ditt eige tempo med kursa våre."
      />

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ingen kurs er publisert enda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const moduleCount = course.modules?.length ?? 0;
            const lessonCount = countLessons(course.modules);
            return (
              <Link
                key={course.id}
                href={`/on-poynt/kurs/${course.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden">
                  {course.featuredImage &&
                    typeof course.featuredImage !== "number" && (
                      <div className="relative aspect-video bg-muted">
                        <PayloadImage
                          media={course.featuredImage as Media}
                          alt={
                            (course.featuredImage as Media).alt || course.title
                          }
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                  <CardContent className="p-4">
                    <h2 className="font-semibold">{course.title}</h2>
                    {course.excerpt && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {course.excerpt}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {moduleCount} modular · {lessonCount} leksjonar
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
