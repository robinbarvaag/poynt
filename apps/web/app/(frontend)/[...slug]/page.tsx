import { RenderBlocks } from "@/components/render-blocks";
import config from "@/payload.config";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

async function getPage(slug: string) {
  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2,
  });

  return pages.docs[0] || null;
}

async function checkRedirect(pathname: string) {
  const payload = await getPayload({ config });

  // Bruk redirects-pluginets collection-skjema
  const redirects = await payload.find({
    collection: "redirects",
    where: {
      from: { equals: pathname },
    },
    limit: 1,
    depth: 1,
  });

  const redirectDoc = redirects.docs[0];
  if (!redirectDoc) return null;

  // Pluginet har 'to.type', 'to.reference' eller 'to.url'
  let destination: string;

  if (redirectDoc.to?.type === "custom" && redirectDoc.to?.url) {
    destination = redirectDoc.to.url;
  } else if (
    redirectDoc.to?.type === "reference" &&
    redirectDoc.to?.reference
  ) {
    const ref = redirectDoc.to.reference;
    const value = typeof ref.value === "object" ? ref.value : null;
    if (!value || !("slug" in value)) return null;
    destination = value.slug === "forside" ? "/" : `/${value.slug}`;
  } else {
    return null;
  }

  return { destination };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug: slugArray } = await params;
  const slug = slugArray ? slugArray.join("/") : "forside";

  const page = await getPage(slug);

  if (!page) {
    return { title: "Side ikke funnet" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const pageUrl = page.slug === "forside" ? baseUrl : `${baseUrl}/${page.slug}`;

  // Bruk SEO-feltene fra pluginet (legges til som 'meta' group)
  const seo = (page as any).meta || {};
  const title = seo.title || page.title;
  const description = seo.description || "";
  const image = seo.image;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      ...(image && {
        images: [
          {
            url: typeof image === "object" ? image.url : image,
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
  };
}

export default async function Page({ params }: PageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray ? slugArray.join("/") : "forside";
  const pathname = `/${slug}`;

  // Sjekk for redirect først
  const redirectInfo = await checkRedirect(pathname);
  if (redirectInfo) {
    redirect(redirectInfo.destination);
  }

  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

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

  return pages.docs
    .filter((page) => page.slug) // Filtrer ut sider uten slug
    .map((page) => ({
      slug: page.slug === "forside" ? [] : page.slug.split("/"),
    }));
}
