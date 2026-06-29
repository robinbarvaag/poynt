import { ArticleRichText } from "@/components/article-rich-text";
import { PayloadImage, resolveMediaUrl } from "@/components/payload-image";
import type { Guide } from "@/payload-types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import {
  BookmarkCard,
  Callout,
  ColumnsLayout,
  DownloadCard,
  type DownloadKind,
  Gallery,
  type GalleryItem,
  GuideToggle,
  type GuideToggleItem,
  ImagePlaceholder,
  Lightbox,
  VideoEmbed,
  VideoPlayer,
} from "@poynt/ui";
import { Reveal } from "@poynt/ui/motion";
import type { ReactNode } from "react";

/** Sant når et Payload-media-felt faktisk har et bilde (ikke null/id). */
function hasMedia(media: unknown): boolean {
  return Boolean(media && typeof media === "object" && "url" in media);
}

/**
 * Pakker en blokk i en seksjon med valgfri overskrift + ingress, så innholdet
 * grupperes visuelt uten en løs heading-blokk over.
 */
function Grouped({
  title,
  intro,
  className,
  children,
}: {
  title?: string | null;
  intro?: string | null;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Reveal className={`flex flex-col gap-4 ${className ?? ""}`}>
      {(title || intro) && (
        <header className="flex flex-col gap-1.5">
          {title && (
            <h2 className="font-heading font-semibold text-2xl text-foreground md:text-3xl">
              {title}
            </h2>
          )}
          {intro && (
            <p className="text-muted-foreground leading-relaxed">{intro}</p>
          )}
        </header>
      )}
      {children}
    </Reveal>
  );
}

/** Forhåndsvisningsbilde for et bokmerke: manuelt opplastet > hentet OG-bilde. */
function bookmarkImage(item: {
  image?: unknown;
  imageUrl?: string | null;
}): ReactNode {
  if (hasMedia(item.image)) {
    // biome-ignore lint/suspicious/noExplicitAny: PayloadImage tar løs media-type
    return <PayloadImage media={item.image as any} alt="" />;
  }
  if (item.imageUrl) {
    // OG-bilde hotlinkes fra kilden → vanlig <img> (unngår next/image-remotePatterns)
    return <img src={item.imageUrl} alt="" loading="lazy" />;
  }
  return undefined;
}

type GuideBlock = NonNullable<Guide["content"]>[number];

const proseClass =
  "prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground";

/** Felles lexical → JSX, samme renderer som artikler bruker. */
function Rich({ data }: { data: unknown }) {
  return <ArticleRichText data={data as SerializedEditorState} />;
}

function GuideImageFigure({
  media,
  caption,
}: {
  media: unknown;
  /** Redaksjonell bildetekst — vises som figcaption under ekte bilder. */
  caption?: string | null;
}) {
  return (
    <figure className="flex flex-col gap-2">
      {hasMedia(media) ? (
        // Klikk forstørrer bildet i en lightbox; hover viser et mint slør.
        <Lightbox
          // biome-ignore lint/suspicious/noExplicitAny: resolveMediaUrl tar løs media-type
          src={resolveMediaUrl(media as any)}
          // biome-ignore lint/suspicious/noExplicitAny: løs media-type
          alt={(media as any)?.alt ?? undefined}
          caption={caption ?? undefined}
          tone="mint"
          className="relative overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-foreground/10 *:[img]:h-auto *:[img]:w-full"
        >
          {/* Alt-tekst hentes fra Mediets eget alt-felt (i PayloadImage), aldri
              fra den synlige bildeteksten — de skal være uavhengige. */}
          {/* biome-ignore lint/suspicious/noExplicitAny: PayloadImage tar løs media-type */}
          <PayloadImage media={media as any} />
        </Lightbox>
      ) : (
        // Tom rute: vis en evt. bildetekst som hint til redaktøren.
        <ImagePlaceholder label={caption ?? undefined} />
      )}
      {hasMedia(media) && caption && (
        <figcaption className="text-center text-muted-foreground text-sm">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/** Felles felt-form for en selv-hostet video (delt av Video-blokk + kolonne). */
type UploadedVideoData = {
  videoFile?: unknown;
  poster?: unknown;
  autoplay?: boolean | null;
  muted?: boolean | null;
  loop?: boolean | null;
  showControls?: boolean | null;
  caption?: string | null;
};

/** Render av en opplastet video med vår egen player; tom rute om fila mangler. */
function UploadedVideo({ data }: { data: UploadedVideoData }) {
  // biome-ignore lint/suspicious/noExplicitAny: resolveMediaUrl tar løs media-type
  const src = resolveMediaUrl(data.videoFile as any);
  if (!src) {
    return <ImagePlaceholder label={data.caption ?? undefined} />;
  }
  return (
    <VideoPlayer
      src={src}
      // biome-ignore lint/suspicious/noExplicitAny: resolveMediaUrl tar løs media-type
      poster={resolveMediaUrl(data.poster as any)}
      autoPlay={Boolean(data.autoplay)}
      muted={Boolean(data.muted)}
      loop={Boolean(data.loop)}
      controls={data.showControls !== false}
      caption={data.caption ?? undefined}
    />
  );
}

/**
 * Plasserer en blokk i en navngitt kolonne på artikkel-grid-et (se page.tsx):
 * `content` = den smale lesespalten, `wide`/`full` bryter ut bredere. Dette
 * erstatter de gamle negative-margin-utbruddene — selve grid-malen styrer
 * utbruddet, så headeren (tittel/ingress) i `Grouped` aligner alltid med
 * innholdet. Når innholdsmenyen er på faller wide/full sammen med content
 * (grid-malen har da ikke slakk til utbrudd ved siden av menyen).
 */
function colClass(width?: "normal" | "wide" | "full" | null): string {
  if (width === "full") return "col-[full]";
  if (width === "wide") return "col-[wide]";
  return "col-[content]";
}

function renderBlock(block: GuideBlock, key: string) {
  switch (block.blockType) {
    case "guideRichText":
      return (
        <Reveal key={key} className={`col-[content] ${proseClass}`}>
          <Rich data={block.content} />
        </Reveal>
      );

    case "guideCallout":
      return (
        <Callout
          key={key}
          className="col-[content]"
          tone={block.tone ?? "mint"}
          icon={block.icon ?? undefined}
        >
          <Rich data={block.content} />
        </Callout>
      );

    case "guideColumns": {
      const columns = (block.columns ?? []).map((col, i) => {
        const cKey = col.id ?? `col-${i}`;
        if (col.type === "image") {
          return (
            <GuideImageFigure
              key={cKey}
              media={col.image}
              caption={col.caption}
            />
          );
        }
        if (col.type === "video") {
          return <UploadedVideo key={cKey} data={col} />;
        }
        return col.content ? (
          <div key={cKey} className={proseClass}>
            <Rich data={col.content} />
          </div>
        ) : (
          <div key={cKey} />
        );
      });
      return (
        <Grouped
          key={key}
          className={colClass(block.width ?? "wide")}
          title={block.title}
          intro={block.intro}
        >
          <ColumnsLayout columns={columns} align={block.align ?? "top"} />
        </Grouped>
      );
    }

    case "guideGallery": {
      const items: GalleryItem[] = (block.images ?? []).map((img) => {
        // biome-ignore lint/suspicious/noExplicitAny: løs media-type
        const media = img.image as any;
        const real = hasMedia(media);
        return {
          node: real ? (
            // Alt fra Mediets eget alt-felt (i PayloadImage), ikke bildeteksten.
            <PayloadImage media={media} />
          ) : (
            <ImagePlaceholder fill label={img.caption ?? undefined} />
          ),
          // Figcaption kun for ekte bilder med en redaksjonell bildetekst.
          caption: real ? (img.caption ?? undefined) : undefined,
          // Full-størrelse-URL + alt → klikk åpner lightbox (kun ekte bilder).
          src: real ? resolveMediaUrl(media) : undefined,
          alt: real ? (media?.alt ?? undefined) : undefined,
        };
      });
      return (
        <Grouped
          key={key}
          className="col-[content]"
          title={block.title}
          intro={block.intro}
        >
          <Gallery
            items={items}
            layout={block.layout ?? "grid"}
            caption={block.caption ?? undefined}
          />
        </Grouped>
      );
    }

    case "guideImage": {
      const width = block.width ?? "normal";
      const align = block.align ?? "center";
      // Justering gjelder bare normal bredde — bred/full fyller hele kolonnen.
      const alignClass =
        align === "left"
          ? "mr-auto"
          : align === "right"
            ? "ml-auto"
            : "mx-auto";
      const innerClass = width === "normal" ? `max-w-2xl ${alignClass}` : "";
      return (
        <Grouped
          key={key}
          className={colClass(width)}
          title={block.title}
          intro={block.intro}
        >
          <div className={innerClass}>
            <GuideImageFigure media={block.image} caption={block.caption} />
          </div>
        </Grouped>
      );
    }

    case "guideVideo":
      return (
        <Grouped
          key={key}
          className="col-[content]"
          title={block.title}
          intro={block.intro}
        >
          {block.source === "upload" ? (
            <UploadedVideo data={block} />
          ) : (
            <VideoEmbed
              url={block.url ?? ""}
              caption={block.caption ?? undefined}
            />
          )}
        </Grouped>
      );

    case "guideToggle": {
      const items: GuideToggleItem[] = (block.items ?? []).map((item) => ({
        title: item.title,
        content: item.content ? <Rich data={item.content} /> : undefined,
      }));
      return (
        <Grouped
          key={key}
          className="col-[content]"
          title={block.title}
          intro={block.intro}
        >
          <GuideToggle items={items} />
        </Grouped>
      );
    }

    case "guideBookmark": {
      const items = block.items ?? [];
      // Et enkelt bokmerke får full bredde + stor OG-stil; flere legges i rutenett.
      const single = items.length === 1;
      return (
        <Grouped
          key={key}
          className="col-[content]"
          title={block.title}
          intro={block.intro}
        >
          <div
            className={
              single
                ? "grid grid-cols-1"
                : "grid grid-cols-1 gap-3 sm:grid-cols-2"
            }
          >
            {items.map((item) => (
              <BookmarkCard
                key={item.id ?? item.url}
                url={item.url ?? undefined}
                title={item.title ?? undefined}
                description={item.description ?? undefined}
                image={bookmarkImage(item)}
                featured={single}
              />
            ))}
          </div>
        </Grouped>
      );
    }

    case "guideDownload":
      return (
        <Grouped
          key={key}
          className="col-[content]"
          title={block.title}
          intro={block.intro}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(block.items ?? []).map((item) => {
              const file =
                item.file && typeof item.file === "object" ? item.file : null;
              const href = file?.url ?? item.url ?? undefined;
              return (
                <DownloadCard
                  key={item.id ?? item.title}
                  title={item.title}
                  description={item.description ?? undefined}
                  kind={(item.kind ?? "pdf") as DownloadKind}
                  href={href}
                />
              );
            })}
          </div>
        </Grouped>
      );

    case "guideDivider":
      return (
        <div key={key} className="col-[content] flex items-center gap-4 py-2">
          <span className="h-px flex-1 bg-foreground/10" />
          {block.label && (
            <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
              {block.label}
            </span>
          )}
          <span className="h-px flex-1 bg-foreground/10" />
        </div>
      );

    default:
      return null;
  }
}

export function GuideBlocks({ blocks }: { blocks: Guide["content"] }) {
  if (!blocks || blocks.length === 0) return null;
  // Blokkene rendres som direkte barn av artikkel-grid-et (i page.tsx), så
  // hver blokk kan plasseres i sin egen kolonne (content/wide/full) via colClass.
  return (
    <>
      {blocks.map((block, i) => renderBlock(block, block.id ?? `block-${i}`))}
    </>
  );
}
