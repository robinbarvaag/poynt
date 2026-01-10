import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import { RenderBlocks } from "@/components/render-blocks";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray ? slugArray.join("/") : "forside";

  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  });

  if (pages.docs.length === 0) {
    notFound();
  }

  const page = pages.docs[0];

  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      {page.layout && <RenderBlocks blocks={page.layout} />}
    </div>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
  });

  return pages.docs.map((page) => ({
    slug: page.slug === "forside" ? [] : page.slug.split("/"),
  }));
}
