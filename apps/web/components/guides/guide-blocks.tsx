import { ArticleRichText } from "@/components/article-rich-text";
import { PayloadImage } from "@/components/payload-image";
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
  VideoEmbed,
} from "@poynt/ui";
import { Reveal } from "@poynt/ui/motion";

/** Sant når et Payload-media-felt faktisk har et bilde (ikke null/id). */
function hasMedia(media: unknown): boolean {
  return Boolean(media && typeof media === "object" && "url" in media);
}

type GuideBlock = NonNullable<Guide["content"]>[number];

const proseClass =
  "prose prose-lg max-w-none prose-headings:font-heading prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-foreground";

/** Felles lexical → JSX, samme renderer som artiklar bruker. */
function Rich({ data }: { data: unknown }) {
  return <ArticleRichText data={data as SerializedEditorState} />;
}

function GuideImageFigure({
  media,
  caption,
}: {
  media: unknown;
  caption?: string | null;
}) {
  return (
    <figure className="flex flex-col gap-2">
      {hasMedia(media) ? (
        <div className="relative overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-foreground/10 *:[img]:h-auto *:[img]:w-full">
          {/* biome-ignore lint/suspicious/noExplicitAny: PayloadImage tar løs media-type */}
          <PayloadImage media={media as any} alt={caption ?? ""} />
        </div>
      ) : (
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

function renderBlock(block: GuideBlock, key: string) {
  switch (block.blockType) {
    case "guideRichText":
      return (
        <Reveal key={key} className={proseClass}>
          <Rich data={block.content} />
        </Reveal>
      );

    case "guideCallout":
      return (
        <Callout
          key={key}
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
        return col.content ? (
          <div key={cKey} className={proseClass}>
            <Rich data={col.content} />
          </div>
        ) : (
          <div key={cKey} />
        );
      });
      return (
        <ColumnsLayout
          key={key}
          columns={columns}
          align={block.align ?? "top"}
        />
      );
    }

    case "guideGallery": {
      const items: GalleryItem[] = (block.images ?? []).map((img) => ({
        node: hasMedia(img.image) ? (
          // biome-ignore lint/suspicious/noExplicitAny: løs media-type
          <PayloadImage media={img.image as any} alt={img.caption ?? ""} />
        ) : (
          <ImagePlaceholder fill label={img.caption ?? undefined} />
        ),
        caption: hasMedia(img.image) ? (img.caption ?? undefined) : undefined,
      }));
      return (
        <Gallery
          key={key}
          items={items}
          layout={block.layout ?? "grid"}
          caption={block.caption ?? undefined}
        />
      );
    }

    case "guideImage": {
      const width = block.width ?? "normal";
      const widthClass =
        width === "full"
          ? "-mx-6 md:mx-0"
          : width === "wide"
            ? "md:-mx-12"
            : "mx-auto max-w-2xl";
      return (
        <Reveal key={key} className={widthClass}>
          <GuideImageFigure media={block.image} caption={block.caption} />
        </Reveal>
      );
    }

    case "guideVideo":
      return (
        <VideoEmbed
          key={key}
          url={block.url}
          caption={block.caption ?? undefined}
        />
      );

    case "guideToggle": {
      const items: GuideToggleItem[] = (block.items ?? []).map((item) => ({
        title: item.title,
        content: item.content ? <Rich data={item.content} /> : undefined,
      }));
      return <GuideToggle key={key} items={items} />;
    }

    case "guideBookmark":
      return (
        <Reveal key={key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(block.items ?? []).map((item) => (
            <BookmarkCard
              key={item.id ?? item.url}
              url={item.url ?? undefined}
              title={item.title ?? undefined}
              description={item.description ?? undefined}
              image={
                item.image ? (
                  // biome-ignore lint/suspicious/noExplicitAny: løs media-type
                  <PayloadImage media={item.image as any} alt="" />
                ) : undefined
              }
            />
          ))}
        </Reveal>
      );

    case "guideDownload":
      return (
        <Reveal key={key} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </Reveal>
      );

    case "guideDivider":
      return (
        <div key={key} className="flex items-center gap-4 py-2">
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
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {blocks.map((block, i) => renderBlock(block, block.id ?? `block-${i}`))}
    </div>
  );
}
