import { AdminBar } from "@/components/admin-bar";
import { RenderBlocks } from "@/components/render-blocks";
import { buildMetadata, firstHeroImage } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

async function getHomepage() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });
  return payload.findGlobal({ slug: "homepage", depth: 2 });
}

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getHomepage();

  const meta = homepage?.meta || {};
  return buildMetadata({
    title: meta.title || "Poynt – Din læringsplattform for kurs og opplæring",
    absoluteTitle: true,
    description: meta.description ?? undefined,
    image: meta.image || firstHeroImage(homepage?.layout),
    noIndex: meta.noIndex ?? undefined,
  });
}

export default async function HomePage() {
  const homepage = await getHomepage();

  if (!homepage?.layout?.length) {
    return (
      <div className="max-w-6xl mx-auto py-12 ">
        <AdminBar global="homepage" singular="forside" />
        <p className="text-gray-500">
          Rediger forsiden i admin under "Forside"
        </p>
      </div>
    );
  }

  return (
    <>
      <AdminBar global="homepage" singular="forside" />
      <RenderBlocks blocks={homepage.layout} />
    </>
  );
}
