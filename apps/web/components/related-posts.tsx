import { toBlogCard } from "@/lib/blog";
import { SECTION_TITLES } from "@/lib/ui-text";
import type { BlogPost } from "@/payload-types";
import { BlogGrid, Container, Heading } from "@poynt/ui";

interface RelatedPostsProps {
  /** Relaterte innlegg (populert med `depth ≥ 2` på forelderen). */
  posts: BlogPost[];
  title?: string;
}

/**
 * Velger rutenett ut fra antall innlegg, så seksjonen alltid fyller bredden
 * uten «foreldreløse» kort:
 *  - 1 innlegg  → ett stort fremhevet kort (bilde til venstre, tekst til høyre)
 *  - 2 innlegg  → to like kolonner
 *  - 4 innlegg  → 2×2 (i stedet for 3 + 1)
 *  - ellers     → tre kolonner
 */
function layoutFor(count: number): { columns: 2 | 3; featureFirst: boolean } {
  if (count === 1) return { columns: 2, featureFirst: true };
  if (count === 2 || count === 4) return { columns: 2, featureFirst: false };
  return { columns: 3, featureFirst: false };
}

/**
 * «Relaterte innlegg»-seksjon. Gjenbruker `BlogGrid` + `toBlogCard` slik at
 * kortene ser identiske ut med bloggoversikten — ingen egen kort-JSX.
 *
 * Ligger i sin egen (bredere) `Container` og skal derfor rendres *utenfor*
 * artikkelens smale lesekolonne.
 */
export function RelatedPosts({
  posts,
  title = SECTION_TITLES.relatedPosts,
}: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  const { columns, featureFirst } = layoutFor(posts.length);

  return (
    <Container as="section" padding="none" className="mt-16 pb-8 md:pb-12">
      <aside className="border-border border-t pt-10">
        <Heading size="h2" color="foreground" customStyles="mb-8">
          {title}
        </Heading>
        <BlogGrid
          posts={posts.map(toBlogCard)}
          columns={columns}
          featureFirst={featureFirst}
        />
      </aside>
    </Container>
  );
}
