import { PageHero } from "@/components/page-hero";
import { RenderBlocks } from "@/components/render-blocks";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}
1;

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
    return notFoundMetadata("Side ikke funnet");
  }

  // Bruk SEO-feltene fra pluginet (legges til som 'meta' group)
  const seo = page.meta || {};
  return buildMetadata({
    title: seo.title || page.title,
    description: seo.description ?? undefined,
    path: page.slug === "forside" ? "" : `/${page.slug}`,
    image: seo.image,
  });
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

  // Sjekk om første blokk er en hero - da viser vi ikke egen page hero
  const firstBlock = page.layout?.[0];
  const hasHeroBlock = firstBlock?.blockType === "hero";

  return (
    <>
      {!hasHeroBlock && <PageHero title={page.title} size="large" />}
      {page.layout && <RenderBlocks blocks={page.layout} />}
    </>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    limit: 1000,
  });

  return (
    pages.docs
      .filter((page) => page.slug) // Filtrer ut sider uten slug
      // /kontakt eies av en dedikert rute (app/(frontend)/kontakt) for å pare med
      // intercepting-modalet — ikke generer den her, ellers kolliderer rutene.
      .filter((page) => page.slug !== "kontakt")
      .map((page) => ({
        slug: page.slug === "forside" ? [] : page.slug.split("/"),
      }))
  );
}
