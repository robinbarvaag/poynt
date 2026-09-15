import { BOOK_PALETTE } from "@/lib/book-brand";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
  type VekstLink,
} from "@poynt/ui";

/** Delte hjelpere for adapterne til vekst-blokkene. */

export function vekstPalette(value?: string | null): ChapterPalette {
  return value === "poynt" ? POYNT_CHAPTER_PALETTE : BOOK_PALETTE;
}

export function text(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function vekstLink(
  label?: string | null,
  href?: string | null
): VekstLink | undefined {
  const l = text(label);
  const h = text(href);
  return l && h ? { label: l, href: h } : undefined;
}

export interface QuestionRow {
  question?: string | null;
  id?: string | null;
}

export function questionList(rows?: QuestionRow[] | null): string[] {
  return (rows ?? [])
    .map((row) => text(row.question))
    .filter((q): q is string => Boolean(q));
}

export interface VekstHeaderProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  palette?: string | null;
}

export function headerProps(props: VekstHeaderProps) {
  return {
    eyebrow: text(props.eyebrow),
    title: text(props.title),
    intro: text(props.intro),
    palette: vekstPalette(props.palette),
  };
}
