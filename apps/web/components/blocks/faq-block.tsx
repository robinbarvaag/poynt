import { Faq, type FaqItem } from "@poynt/ui";

interface FaqItemInput {
  question: string;
  answer: string;
}

interface FaqBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  items?: FaqItemInput[] | null;
}

/** Mapper Payload-blokken `faq` til Faq i @poynt/ui. */
export function FaqBlock({ eyebrow, title, intro, items }: FaqBlockProps) {
  const mapped: FaqItem[] = (items ?? []).map((i) => ({
    question: i.question,
    answer: i.answer,
  }));
  return (
    <Faq
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      items={mapped}
    />
  );
}
