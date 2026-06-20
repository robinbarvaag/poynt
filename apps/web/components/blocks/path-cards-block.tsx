import { type PathCardItem, PathCards, type PathSurface } from "@poynt/ui";

interface PathInput {
  id?: string | null;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  href: string;
  ctaLabel?: string | null;
  items?: { id?: string | null; text: string }[] | null;
  surface?: PathSurface | null;
}

interface PathCardsBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  columns?: "2" | "3" | null;
  paths?: PathInput[] | null;
}

/**
 * Wrapper som mapper Payload-blokken `pathCards` til presentasjons-
 * komponenten `PathCards` i @poynt/ui.
 */
export function PathCardsBlock({
  eyebrow,
  title,
  intro,
  columns,
  paths,
}: PathCardsBlockProps) {
  const items: PathCardItem[] = (paths ?? []).map((p, index) => ({
    id: p.id ?? index,
    href: p.href,
    title: p.title,
    eyebrow: p.eyebrow ?? undefined,
    description: p.description ?? undefined,
    ctaLabel: p.ctaLabel ?? undefined,
    surface: p.surface ?? undefined,
    items: p.items?.map((i) => i.text).filter(Boolean),
  }));

  return (
    <PathCards
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      columns={columns ? (Number(columns) as 2 | 3) : undefined}
      paths={items}
    />
  );
}
