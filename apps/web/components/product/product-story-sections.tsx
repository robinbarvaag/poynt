"use client";

import { PayloadImage, resolveMediaUrl } from "@/components/payload-image";
import type { Product } from "@/payload-types";
import { Heading, Text, VideoEmbed, VideoPlayer } from "@poynt/ui";
import dynamic from "next/dynamic";

// pdf.js er tung og trenger nettleser-API-er – lastes kun i klienten, og kun
// når produktet faktisk har en PDF-smakebit.
const PdfPreview = dynamic(() => import("./pdf-preview"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto h-96 w-full max-w-xl animate-pulse rounded-2xl bg-muted" />
  ),
});

function SectionShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12 border-t border-border pt-12">
      <div className="mb-6 text-center">
        <Heading size="h2" color="foreground">
          {title}
        </Heading>
        {intro && (
          <Text variant="muted" customStyles="mx-auto mt-3 max-w-2xl">
            {intro}
          </Text>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * «Bakside»-seksjonen: et ekte foto av baksiden (av boka, esken, …) med
 * baksideteksten lagt oppå som en teipet lapp – bevisst litt skjevt.
 * På mobil overlapper lappen nederst på bildet, på desktop henger den
 * over høyre kant.
 */
function BackCoverSection({ backCover }: { backCover: Product["backCover"] }) {
  const image =
    backCover?.image && typeof backCover.image === "object"
      ? backCover.image
      : null;
  const text = backCover?.text?.trim();
  if (!(image || text)) return null;

  return (
    <SectionShell title="Baksiden">
      <div className="relative mx-auto max-w-4xl">
        {image && (
          <div className={text ? "lg:pr-48" : undefined}>
            <div className="-rotate-1 overflow-hidden rounded-3xl shadow-md">
              <PayloadImage
                media={image}
                alt={image.alt || "Baksiden"}
                width={image.width ?? 1200}
                height={image.height ?? 900}
                className="h-auto w-full"
                sizes="(min-width: 1024px) 56rem, 100vw"
              />
            </div>
          </div>
        )}

        {text && (
          <figure
            className={
              image
                ? "-mt-10 relative mx-4 rotate-1 rounded-3xl border border-border bg-card p-6 shadow-xl sm:mx-10 sm:p-8 lg:-translate-y-1/2 lg:absolute lg:top-1/2 lg:right-0 lg:mx-0 lg:mt-0 lg:w-96"
                : "relative mx-auto max-w-xl rotate-1 rounded-3xl border border-border bg-card p-8 shadow-xl"
            }
          >
            {/* «Teip»-stripe som fester lappen til bildet */}
            <span
              aria-hidden="true"
              className="-top-3 -translate-x-1/2 -rotate-2 absolute left-1/2 h-6 w-24 rounded-sm bg-accent-1/70"
            />
            <blockquote className="whitespace-pre-line text-foreground leading-relaxed">
              {text}
            </blockquote>
          </figure>
        )}

        {backCover?.note && (
          <Text
            variant="muted"
            customStyles="mt-6 text-center text-sm italic lg:mt-10"
          >
            {backCover.note}
          </Text>
        )}
      </div>
    </SectionShell>
  );
}

/** Lesersitater som fargeglade lapper med alternerende helning. */
function ReaderQuotesSection({
  quotes,
}: {
  quotes: NonNullable<Product["readerQuotes"]>;
}) {
  return (
    <SectionShell title="Fra leserne">
      <ul className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quotes.map((quote, index) => (
          <li
            key={quote.id ?? index}
            className={`flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm ${
              index % 2 === 0 ? "rotate-1" : "-rotate-1"
            }`}
          >
            <span
              aria-hidden="true"
              className="font-serif text-5xl text-accent-1 leading-none"
            >
              “
            </span>
            <blockquote className="mt-1 flex-1 text-foreground leading-relaxed">
              {quote.quote}
            </blockquote>
            {(quote.name || quote.detail) && (
              <figcaption className="mt-4 text-muted-foreground text-sm">
                {quote.name && (
                  <span className="font-medium text-foreground">
                    {quote.name}
                  </span>
                )}
                {quote.name && quote.detail && " – "}
                {quote.detail}
              </figcaption>
            )}
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}

/** Videoer: innebygd YouTube/Vimeo/Loom eller selv-hostet fil. */
function VideosSection({
  videos,
  title,
  intro,
}: {
  videos: NonNullable<Product["videos"]>;
  title?: string | null;
  intro?: string | null;
}) {
  const renderable = videos.filter((video) =>
    video.source === "upload"
      ? Boolean(resolveMediaUrl(video.videoFile))
      : Boolean(video.embedUrl)
  );
  if (renderable.length === 0) return null;

  return (
    <SectionShell title={title?.trim() || "Se og hør"} intro={intro}>
      <div className="mx-auto max-w-4xl space-y-10">
        {renderable.map((video, index) => {
          const uploadedSrc = resolveMediaUrl(video.videoFile);
          return (
            <div key={video.id ?? index}>
              {video.title && (
                <Heading variant="h4" color="foreground" customStyles="mb-4">
                  {video.title}
                </Heading>
              )}
              {video.source === "upload" && uploadedSrc ? (
                <VideoPlayer
                  src={uploadedSrc}
                  poster={resolveMediaUrl(video.poster)}
                  autoPlay={Boolean(video.autoplay)}
                  muted={Boolean(video.muted)}
                  loop={Boolean(video.loop)}
                  controls={video.showControls !== false}
                />
              ) : (
                <VideoEmbed
                  url={video.embedUrl ?? ""}
                  title={video.title ?? "Produktvideo"}
                />
              )}
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}

/**
 * «Historie»-seksjonene på produktsiden: mellomlang beskrivelse, bakside,
 * lesersitater, PDF-smakebit og video. Alle er valgfrie og datadrevne, så de
 * fungerer for alle produkttyper – ikke bare bøker.
 */
export function ProductStorySections({ product }: { product: Product }) {
  const pdfUrl = resolveMediaUrl(product.pdfPreview?.file);
  const quotes = product.readerQuotes ?? [];
  const videos = product.videos ?? [];

  const hasBackCover = Boolean(
    (product.backCover?.image && typeof product.backCover.image === "object") ||
      product.backCover?.text?.trim()
  );
  const hasAnything =
    Boolean(product.mediumDescription?.trim()) ||
    hasBackCover ||
    quotes.length > 0 ||
    Boolean(pdfUrl) ||
    videos.length > 0;

  if (!hasAnything) return null;

  return (
    <div>
      {product.mediumDescription?.trim() && (
        <div className="mt-12 border-t border-border pt-12">
          <Text
            variant="lead"
            customStyles="mx-auto max-w-2xl whitespace-pre-line text-center"
          >
            {product.mediumDescription}
          </Text>
        </div>
      )}

      <BackCoverSection backCover={product.backCover} />

      {quotes.length > 0 && <ReaderQuotesSection quotes={quotes} />}

      {pdfUrl && (
        <SectionShell
          title={product.pdfPreview?.title || "Ta en titt inni"}
          intro={product.pdfPreview?.description}
        >
          <PdfPreview url={pdfUrl} fileName={product.name} />
        </SectionShell>
      )}

      {videos.length > 0 && (
        <VideosSection
          videos={videos}
          title={product.videosTitle}
          intro={product.videosIntro}
        />
      )}
    </div>
  );
}
