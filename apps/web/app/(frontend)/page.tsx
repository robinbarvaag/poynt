import { RenderBlocks } from "@/components/render-blocks";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "homepage", depth: 2 });

  const meta = homepage?.meta || {};
  return buildMetadata({
    title: meta.title || "Poynt – Din læringsplattform for kurs og opplæring",
    absoluteTitle: true,
    description: meta.description ?? undefined,
    image: meta.image,
    noIndex: meta.noIndex ?? undefined,
  });
}

export default async function HomePage() {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "homepage", depth: 2 });

  if (!homepage?.layout?.length) {
    return (
      <div className="max-w-6xl mx-auto py-12 ">
        <p className="text-gray-500">
          Rediger forsiden i admin under "Forside"
        </p>
      </div>
    );
  }

  return <RenderBlocks blocks={homepage.layout} />;
}
