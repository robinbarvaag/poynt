import { CmsPageView } from "@/components/views/cms-page-view";
import { buildMetadata, firstHeroImage, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

async function getPage(slug: string) {
  "use cache";
  cacheTag("cms");
  // Innhold invalideres eksplisitt via cacheTag("cms") ved publisering
  // (lib/revalidate-cms.ts) — tidsbasert utløp trengs ikke, og «max» holder
  // cachen varm så navigasjonen ikke stopper på kalde Payload-spørringer.
  cacheLife("max");

  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: { equals: slug },
      _status: { equals: "published" },
    },
    limit: 1,
    depth: 2,
  });

  return pages.docs[0] || null;
}

async function checkRedirect(pathname: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

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
    image: seo.image || firstHeroImage(page.layout),
    // «Open Graph type»-feltet fra SEO-fanen (product mangler i Next-typen —
    // faller tilbake til website, som er riktig oppførsel for delingskort).
    type: seo.ogType === "article" ? "article" : "website",
    noIndex: seo.noIndex ?? undefined,
    canonicalUrl: seo.canonicalUrl,
  });
}

// INGEN Suspense rundt innhaldet — det er med vilje, og det er viktig:
// eit tidlegare skjelett-fallback her gjorde at HEILE sida postponerte under
// PPR (AdminBar sitt cookies()-kall bobla til den ytste grensa), så sjølv
// kjende, prerendra slugs vart servert som skjelett + runtime-streaming på
// kvar førespurnad. Utan grensa bakast heile sida inn i den statiske HTML-en
// (berre AdminBar streamar, med usynleg null-fallback), og prefetch frå
// nav-en får ferdig side. Ukjende stier (f.eks. /sw.js → 404) rendrast
// dynamisk på førespurnad — dei er 404-ar og treng ikkje vere raske.
export default async function Page({ params }: PageProps) {
  const { slug: slugArray } = await params;
  const slug = slugArray ? slugArray.join("/") : "forside";
  return <PageContent slug={slug} />;
}

async function PageContent({ slug }: { slug: string }) {
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

  return <CmsPageView page={page} />;
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
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
