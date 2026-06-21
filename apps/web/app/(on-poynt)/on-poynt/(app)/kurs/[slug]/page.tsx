import { CoursePlayer } from "@/components/planner/courses/course-player";
import config from "@/payload.config";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

export default async function KursDetailPage({ params }: CoursePageProps) {
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

  return <CoursePlayer course={result.docs[0]} />;
}
