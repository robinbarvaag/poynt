import { BookGate } from "@/components/book-gate";
import { CmsPageView } from "@/components/views/cms-page-view";
import { bookCookieName, verifyBookCookie } from "@/lib/book-access";
import { buildMetadata, firstHeroImage, notFoundMetadata } from "@/lib/seo";
import { UNIVERSE, universeHome } from "@/lib/universe";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import { Suspense } from "react";

/**
 * «Verdifull vekst-universet» eier ruta si eksplisitt, i stedet for å gå via
 * [...slug]-catch-allen — på samme måte som /kontakt gjør. Grunnen er ikke
 * innholdet (det er den samme Payload-sida), men rammen: denne ruta ligger i
 * (univers)-gruppa og får dermed universets egen header i stedet for
 * nettstedsmenyen. Se app/(univers)/layout.tsx.
 *
 * Catch-allen må la være å generere den samme slug-en — det er gjort i
 * `generateStaticParams` der.
 */
async function getUniversePage() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: "pages",
    where: {
      slug: { equals: UNIVERSE.slug },
      _status: { equals: "published" },
    },
    limit: 1,
    depth: 2,
  });

  return pages.docs[0] || null;
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getUniversePage();
  if (!page) return notFoundMetadata("Side ikke funnet");

  const seo = page.meta || {};
  return buildMetadata({
    title: seo.title || page.title,
    description: seo.description ?? undefined,
    path: universeHome,
    image: seo.image || firstHeroImage(page.layout),
    // Bak bok-døra og utenfor menyene: skal ikke indekseres, uansett SEO-fane.
    noIndex: true,
    canonicalUrl: seo.canonicalUrl,
  });
}

export default function UniversePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
      <UniverseContent />
    </Suspense>
  );
}

async function UniverseContent() {
  const page = await getUniversePage();

  if (!page) {
    notFound();
  }

  // Siden krever bokkjøp: cookien leses bak Suspense-grensa over, så det er
  // bare denne delen som blir dynamisk.
  if (page.bookGate) {
    const cookieStore = await cookies();
    const unlocked = verifyBookCookie(
      page.id,
      cookieStore.get(bookCookieName(page.id))?.value
    );
    if (!unlocked) {
      return <BookGate pageId={page.id} title={page.title} />;
    }
  }

  return <CmsPageView page={page} />;
}
