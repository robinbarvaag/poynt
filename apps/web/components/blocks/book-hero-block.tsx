import { PayloadImage } from "@/components/payload-image";
import { BOOK_PALETTE } from "@/lib/book-brand";
import type { Media, Form as PayloadForm } from "@/payload-types";
import { BookCover, BookHero, ChapterRotator } from "@poynt/ui";
import { FormBlockComponent } from "./form-block";

interface BookHeroBlockProps {
  badge?: string | null;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  bullets?: { text: string; id?: string | null }[] | null;
  cover?: Media | number | null;
  chapters?:
    | { title: string; text?: string | null; id?: string | null }[]
    | null;
  form?: PayloadForm | number | null;
  note?: string | null;
}

/**
 * Mapper Payload-blokken `bookHero`. Figuren til høyre er omslaget når det
 * finnes, ellers kapittel-kortet — sida oppgraderer seg selv den dagen
 * omslaget lastes opp, uten at noen må bytte blokk.
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
  note,
}: BookHeroBlockProps) {
  const formDoc = typeof form === "object" ? form : null;
  const chapterItems =
    chapters
      ?.filter((chapter) => chapter.title)
      .map((chapter) => ({
        title: chapter.title,
        text: chapter.text ?? undefined,
      })) ?? [];

  let figure = null;
  if (cover) {
    figure = (
      <BookCover>
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
    // Kortet står i BOKAS farger, ikke Poynts – det skal leses som boka, ikke
    // som enda en Poynt-flate.
    figure = <ChapterRotator chapters={chapterItems} palette={BOOK_PALETTE} />;
  }

  return (
    <BookHero
      badge={badge ?? undefined}
      eyebrow={eyebrow ?? undefined}
      title={title}
      subtitle={subtitle ?? undefined}
      bullets={bullets?.map((bullet) => bullet.text).filter(Boolean)}
      note={note ?? undefined}
      figure={figure}
      form={
        formDoc ? (
          <FormBlockComponent form={formDoc} bare hideHeader maxWidth="full" />
        ) : undefined
      }
    />
  );
}
