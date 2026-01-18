import { RenderBlocks } from "@/components/render-blocks";
import config from "@/payload.config";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "homepage", depth: 2 });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const meta = homepage?.meta || {};
  const title = meta.title || "Poynt";
  const description = meta.description || "";
  const image = meta.image;

  return {
    title,
    description,
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
      type: "website",
      ...(image &&
        typeof image === "object" &&
        image.url && {
          images: [
            {
              url: image.url,
              width: 1200,
              height: 630,
            },
          ],
        }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    ...(meta.noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}

export default async function HomePage() {
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: "homepage", depth: 2 });

  if (!homepage?.layout?.length) {
    return (
      <div className="max-w-6xl mx-auto py-12">
        <p className="text-gray-500">
          Rediger forsiden i admin under "Forside"
        </p>
      </div>
    );
  }

  return <RenderBlocks blocks={homepage.layout} />;
}
