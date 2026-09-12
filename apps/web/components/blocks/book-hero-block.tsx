import { BlockLink } from "@/components/block-link";
import { PayloadImage } from "@/components/payload-image";
import { BOOK_PALETTE } from "@/lib/book-brand";
import type { Media, Form as PayloadForm } from "@/payload-types";
import {
  BookCover,
  BookHero,
  Button,
  type ChapterMarkers,
  type ChapterPalette,
  ChapterRotator,
  type FigureAspect,
  POYNT_CHAPTER_PALETTE,
  chapterPaletteFrom,
} from "@poynt/ui";
import { FormBlockComponent } from "./form-block";

interface Cta {
  text?: string | null;
  url?: string | null;
}

interface BookHeroBlockProps {
  badge?: string | null;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  bullets?: { text: string; id?: string | null }[] | null;
  cover?: Media | number | null;
  chapters?:
    | {
        title: string;
        text?: string | null;
        href?: string | null;
        linkLabel?: string | null;
        id?: string | null;
      }[]
    | null;
  form?: PayloadForm | number | null;
  primaryCta?: Cta | null;
  secondaryCta?: Cta | null;
  note?: string | null;
  figureSide?: "left" | "right" | null;
  figureAspect?: FigureAspect | null;
  palette?: "book" | "poynt" | "custom" | null;
  customPalette?: {
    surface?: string | null;
    ink?: string | null;
    accent?: string | null;
  } | null;
  rotatorEyebrow?: string | null;
  rotatorMarkers?: ChapterMarkers | null;
  rotatorInterval?: number | null;
  shapes?: "subtle" | "default" | "none" | null;
}

/** Bare trygge CSS-farger slipper gjennom fra admin (hex/rgb/hsl/navn). */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|[a-z]+\(.*\)|[a-z]+)$/i;
const safeColor = (value: string | null | undefined, fallback: string) =>
  value && SAFE_COLOR.test(value.trim()) ? value.trim() : fallback;

function resolvePalette(
  palette: BookHeroBlockProps["palette"],
  custom: BookHeroBlockProps["customPalette"]
): ChapterPalette {
  if (palette === "poynt") return POYNT_CHAPTER_PALETTE;
  if (palette === "custom") {
    return chapterPaletteFrom({
      surface: safeColor(custom?.surface, BOOK_PALETTE.surface),
      ink: safeColor(custom?.ink, BOOK_PALETTE.ink),
      accent: safeColor(custom?.accent, BOOK_PALETTE.accent),
    });
  }
  // Default = boka. Eksisterende sider (uten feltet) skal se ut som før.
  return BOOK_PALETTE;
}

/**
 * Mapper Payload-blokken `bookHero`. Figuren er omslaget når det finnes,
 * ellers kapittel-kortet — sida oppgraderer seg selv den dagen omslaget
 * lastes opp, uten at noen må bytte blokk. Uten skjema vises knappene.
 */
export function BookHeroBlock({
  badge,
  eyebrow,
  title,
  subtitle,
  bullets,
  cover,
  chapters,
  form,
  primaryCta,
  secondaryCta,
  note,
  figureSide,
  figureAspect,
  palette,
  customPalette,
  rotatorEyebrow,
  rotatorMarkers,
  rotatorInterval,
  shapes,
}: BookHeroBlockProps) {
  const formDoc = typeof form === "object" ? form : null;
  const aspect: FigureAspect = figureAspect ?? "book";
  const chapterItems =
    chapters
      ?.filter((chapter) => chapter.title)
      .map((chapter) => ({
        title: chapter.title,
        text: chapter.text ?? undefined,
        href: chapter.href ?? undefined,
        linkLabel: chapter.linkLabel ?? undefined,
      })) ?? [];

  let figure = null;
  if (cover) {
    figure = (
      <BookCover aspect={aspect}>
        <PayloadImage
          media={cover}
          // Omslaget er hovedbildet i heroen — last det med en gang.
          priority
          sizes="(min-width: 1024px) 24rem, 19rem"
          className="h-full w-full object-cover"
        />
      </BookCover>
    );
  } else if (chapterItems.length > 0) {
    // Kortet står i produktets farger (default boka), ikke Poynts – det skal
    // leses som produktet, ikke som enda en Poynt-flate.
    figure = (
      <ChapterRotator
        chapters={chapterItems}
        palette={resolvePalette(palette, customPalette)}
        eyebrow={rotatorEyebrow || undefined}
        markers={rotatorMarkers ?? "initials"}
        aspect={aspect}
        intervalMs={(rotatorInterval ?? 4) * 1000}
      />
    );
  }

  const ctas = [
    primaryCta?.text && primaryCta.url
      ? { ...primaryCta, variant: "default" as const }
      : null,
    secondaryCta?.text && secondaryCta.url
      ? { ...secondaryCta, variant: "outline" as const }
      : null,
  ].filter((cta): cta is NonNullable<typeof cta> => cta !== null);

  const actions =
    ctas.length > 0 ? (
      <>
        {ctas.map((cta) => (
          <Button
            key={cta.url}
            asChild
            size="lg"
            variant={cta.variant}
            className="rounded-full"
          >
            <BlockLink href={cta.url as string}>{cta.text}</BlockLink>
          </Button>
        ))}
      </>
    ) : undefined;

  return (
    <BookHero
      badge={badge ?? undefined}
      eyebrow={eyebrow ?? undefined}
      title={title}
      subtitle={subtitle ?? undefined}
      bullets={bullets?.map((bullet) => bullet.text).filter(Boolean)}
      note={note ?? undefined}
      figure={figure}
      figureSide={figureSide ?? "right"}
      shapes={shapes ?? "subtle"}
      actions={actions}
      form={
        formDoc ? (
          <FormBlockComponent form={formDoc} bare hideHeader maxWidth="full" />
        ) : undefined
      }
    />
  );
}
