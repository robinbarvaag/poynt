"use client";

import { Button, Text } from "@poynt/ui";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
// Tekstlaget legger usynlig, markerbar tekst oppå canvasen – det er dette som
// gjør innholdet tilgjengelig for skjermlesere og kopierbart for alle.
import "react-pdf/dist/Page/TextLayer.css";

// pdf.js gjør tunge løft i en web worker – bundleren løser stien via
// import.meta.url så worker-versjonen alltid matcher biblioteket.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Zoomgrenser: 100 % fyller rammen; over det panorerer man inne i den.
const MIN_SCALE = 1;
const MAX_SCALE = 2.5;
const SCALE_STEP = 0.5;

export interface PdfPreviewProps {
  /** Direkte URL til PDF-en (Payload media-URL). */
  url: string;
  /** Brukes i fallback-lenken. */
  fileName?: string;
}

/**
 * Blaibar PDF-forhåndsvisning. Sidene rendres til canvas via pdf.js, så
 * visningen fungerer likt på mobil, nettbrett og desktop – i motsetning til
 * <iframe>/<object> som mobil-Safari ikke rendrer inline. Navigasjon via
 * overlay-knapper på boken, piltaster og sveip; progressbar under.
 */
export default function PdfPreview({ url, fileName }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  // Siden som faktisk står ferdig rendret på skjermen. Ved sidebytte beholder
  // vi den gamle siden synlig til den nye er ferdig – uten dette kollapser
  // høyden til 0 mens pdf.js jobber, og layouten hopper.
  const [renderedPage, setRenderedPage] = useState(1);
  // Høyde/bredde-forhold fra selve PDF-en, så rammen kan holde fast høyde
  // allerede før en ny side er rendret.
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number>();
  const [scale, setScale] = useState(1);
  const touchStartX = useRef<number | null>(null);

  // Sidebredde følger containeren – én ResizeObserver i stedet for
  // window-resize, så det også virker når layouten (ikke vinduet) endrer seg.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setPageWidth(Math.min(entry.contentRect.width, 640));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = (delta: number) =>
    setPageNumber((current) =>
      Math.min(Math.max(current + delta, 1), numPages ?? 1)
    );

  const zoom = (delta: number) =>
    setScale((current) =>
      Math.min(Math.max(current + delta, MIN_SCALE), MAX_SCALE)
    );

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-8 text-center">
        <Text variant="muted">Klarte ikke å vise PDF-en her.</Text>
        <Button asChild variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Åpne {fileName ?? "PDF-en"} i ny fane
            <ExternalLink className="ml-2 size-4" />
          </a>
        </Button>
      </div>
    );
  }

  const isTurning = renderedPage !== pageNumber;
  const frameHeight =
    pageWidth != null && aspectRatio != null
      ? Math.round(pageWidth * aspectRatio)
      : undefined;

  return (
    // Piltast-navigasjon: keydown bobler hit fra bla-knappene når de har fokus.
    <div
      ref={containerRef}
      aria-label={`Forhåndsvisning av ${fileName ?? "PDF"}`}
      className="flex w-full flex-col items-center gap-4"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goTo(-1);
        if (event.key === "ArrowRight") goTo(1);
      }}
    >
      <div
        className="relative overflow-hidden rounded-2xl bg-muted shadow-lg ring-1 ring-border"
        style={{ width: pageWidth, height: frameHeight }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStartX.current == null) return;
          const delta = event.changedTouches[0].clientX - touchStartX.current;
          touchStartX.current = null;
          // Zoomet inn = fingerdrag panorerer; pågående tekstmarkering skal
          // heller ikke bla. Sveip blar bare i 100 %-visning.
          if (scale > MIN_SCALE) return;
          if (window.getSelection()?.toString()) return;
          if (Math.abs(delta) > 48) goTo(delta < 0 ? 1 : -1);
        }}
      >
        {/* Ytre ramme står fast; ved zoom scroller/panorerer man her inne. */}
        <div
          className={
            scale > MIN_SCALE
              ? "h-full w-full overflow-auto overscroll-contain"
              : "h-full w-full overflow-hidden"
          }
        >
          <Document
            file={url}
            onLoadSuccess={({ numPages: total }) => setNumPages(total)}
            onLoadError={() => setFailed(true)}
            loading={
              <div
                className="flex animate-pulse items-center justify-center bg-muted"
                style={{
                  width: pageWidth ?? 320,
                  height: (pageWidth ?? 320) * 1.41,
                }}
              >
                <Text variant="muted">Laster smakebit …</Text>
              </div>
            }
          >
            {/* Forrige side blir stående til den nye er ferdig rendret. */}
            {isTurning && (
              <Page
                key={`page-${renderedPage}`}
                pageNumber={renderedPage}
                width={pageWidth != null ? pageWidth * scale : undefined}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={null}
              />
            )}
            <Page
              key={`page-${pageNumber}`}
              pageNumber={pageNumber}
              width={pageWidth != null ? pageWidth * scale : undefined}
              renderTextLayer
              renderAnnotationLayer={false}
              loading={null}
              className={isTurning ? "invisible absolute inset-0" : undefined}
              onLoadSuccess={(page) =>
                setAspectRatio(page.originalHeight / page.originalWidth)
              }
              onRenderSuccess={() => setRenderedPage(pageNumber)}
            />
          </Document>
        </div>

        {/* Bla-knapper oppå boken, midtstilt vertikalt. */}
        {numPages != null && numPages > 1 && (
          <>
            {/* Wrapper eier sentreringen (-translate-y-1/2), så knappens eget
                hover-løft (-translate-y-0.5) ikke kolliderer med den. */}
            <div className="absolute top-1/2 left-3 z-10 -translate-y-1/2">
              <Button
                type="button"
                size="icon"
                className="size-11 rounded-full shadow-lg transition-opacity disabled:opacity-0"
                aria-label="Forrige side"
                onClick={() => goTo(-1)}
                disabled={pageNumber <= 1}
                tabIndex={pageNumber <= 1 ? -1 : 0}
              >
                <ChevronLeft className="size-5" />
              </Button>
            </div>
            <div className="absolute top-1/2 right-3 z-10 -translate-y-1/2">
              <Button
                type="button"
                size="icon"
                className="size-11 rounded-full shadow-lg transition-opacity disabled:opacity-0"
                aria-label="Neste side"
                onClick={() => goTo(1)}
                disabled={pageNumber >= numPages}
                tabIndex={pageNumber >= numPages ? -1 : 0}
              >
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Kontrollinje: zoom + progressbar + sidetall (aria-live for sidebytte). */}
      {numPages != null && (
        <div
          className="flex w-full items-center gap-3"
          style={{ maxWidth: pageWidth }}
        >
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Zoom ut"
              onClick={() => zoom(-SCALE_STEP)}
              disabled={scale <= MIN_SCALE}
            >
              <ZoomOut className="size-4" />
            </Button>
            <Text
              variant="muted"
              customStyles="min-w-12 text-center text-sm tabular-nums"
            >
              {Math.round(scale * 100)} %
            </Text>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Zoom inn"
              onClick={() => zoom(SCALE_STEP)}
              disabled={scale >= MAX_SCALE}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
          <div
            aria-hidden="true"
            className="h-1 flex-1 overflow-hidden rounded-full bg-border"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out motion-reduce:transition-none"
              style={{ width: `${(pageNumber / numPages) * 100}%` }}
            />
          </div>
          <Text
            variant="muted"
            customStyles="shrink-0 text-sm tabular-nums"
            aria-live="polite"
          >
            {pageNumber} / {numPages}
          </Text>
        </div>
      )}
    </div>
  );
}
