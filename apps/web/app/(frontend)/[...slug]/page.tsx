import { CmsPageView } from "@/components/views/cms-page-view";
import { buildMetadata, firstHeroImage, notFoundMetadata } from "@/lib/seo";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

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

// Ukjente stier (f.eks. /sw.js → 404) finst ikkje i generateStaticParams, så
// `params` blir runtime-data under prerender — må lesast bak ei Suspense-grense
// for at cacheComponents/instant-validering ikkje skal klage. Kjende slugs
// prerendres fullt (ingen draft-lesing her lenger — forhåndsvisning bur på
// /forhandsvisning), så prefetch frå nav-en får heile sida og fallbacket
// vises normalt aldri.
// Fallbacket MÅ rendre et ekte element: Next finner «toppen av den nye siden»
// for å scrolle dit ved navigasjon, og et tomt fallback gir ingen node å måle
// — da hopper scrollen over, og man lander midt på den nye siden.
export default function Page({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-6 w-32 rounded-full bg-muted" />
          <div className="mt-6 h-12 w-2/3 rounded-2xl bg-muted" />
          <div className="mt-4 h-5 w-1/2 rounded-full bg-muted" />
        </div>
      }
    >
      <PageContent params={params} />
    </Suspense>
  );
}

async function PageContent({ params }: PageProps) {
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
