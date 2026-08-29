import { PreviewBanner } from "@/components/preview-banner";
import { RefreshOnSave } from "@/components/refresh-on-save";
import { BlogPostView } from "@/components/views/blog-post-view";
import { CaseStudyView } from "@/components/views/case-study-view";
import { CmsPageView } from "@/components/views/cms-page-view";
import { ServiceView } from "@/components/views/service-view";
import { getDraftBySlug, isDraftModeEnabled } from "@/lib/draft";
import config from "@/payload.config";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

/**
 * Dedikert forhåndsvisningsrute — den ENESTE ruta som leser draft mode.
 * /api/preview slår på draft-cookien og sender redaktøren hit; de offentlige
 * sidene leser aldri cookien og kan dermed prerendres fullt statisk (ekte
 * instant navigation fra nav-en). Speiler de offentlige stiene:
 *
 *   /forhandsvisning                    → pages «forside»
 *   /forhandsvisning/on-poynt           → pages «on-poynt»
 *   /forhandsvisning/blogg/[slug]       → blog-posts
 *   /forhandsvisning/kundehistorier/[…] → case-studies
 *   /forhandsvisning/tjenester/[slug]   → services
 *
 * Alltid ucachet (utkast skal vise siste autosave), alltid noindex.
 */

interface PreviewPageProps {
  params: Promise<{ slug?: string[] }>;
}

export const metadata: Metadata = {
  title: "Forhåndsvisning",
  robots: { index: false, follow: false },
};

export default function PreviewPage({ params }: PreviewPageProps) {
  // Runtime-data (cookie + ustatiske params) må leses bak Suspense.
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-16 sm:px-6 lg:px-8">
          <div className="h-6 w-40 rounded-full bg-muted" />
          <div className="mt-6 h-12 w-2/3 rounded-2xl bg-muted" />
        </div>
      }
    >
      <PreviewContent params={params} />
    </Suspense>
  );
}

async function PreviewContent({ params }: PreviewPageProps) {
  const { slug: slugArray } = await params;
  const segments = slugArray ?? [];
  const publicPath = segments.length > 0 ? `/${segments.join("/")}` : "/";

  // Uten draft-cookie (utløpt økt, delt lenke) er utkastet utilgjengelig —
  // send til den publiserte siden i stedet for å vise en feil.
  if (!(await isDraftModeEnabled())) {
    redirect(publicPath);
  }

  if (segments[0] === "blogg" && segments.length > 1) {
    const post = await getDraftBySlug(
      "blog-posts",
      segments.slice(1).join("/")
    );
    if (!post) notFound();
    return (
      <>
        <RefreshOnSave />
        <PreviewBanner path={publicPath} />
        <BlogPostView post={post} isDraft />
      </>
    );
  }

  if (segments[0] === "tjenester" && segments.length > 1) {
    const [service, servicesPage] = await Promise.all([
      getDraftBySlug("services", segments.slice(1).join("/")),
      getPayload({ config }).then((p) =>
        p.findGlobal({ slug: "servicespage" })
      ),
    ]);
    if (!service) notFound();
    return (
      <>
        <RefreshOnSave />
        <PreviewBanner path={publicPath} />
        <ServiceView service={service} cta={servicesPage?.detailCta} />
      </>
    );
  }

  if (segments[0] === "kundehistorier" && segments.length > 1) {
    const story = await getDraftBySlug(
      "case-studies",
      segments.slice(1).join("/")
    );
    if (!story) notFound();
    return (
      <>
        <RefreshOnSave />
        <PreviewBanner path={publicPath} />
        <CaseStudyView story={story} />
      </>
    );
  }

  const page = await getDraftBySlug(
    "pages",
    segments.length > 0 ? segments.join("/") : "forside"
  );
  if (!page) notFound();
  return (
    <>
      <RefreshOnSave />
      <PreviewBanner path={publicPath} />
      <CmsPageView page={page} />
    </>
  );
}
