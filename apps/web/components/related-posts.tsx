import { toBlogCard } from "@/lib/blog";
import { SECTION_TITLES } from "@/lib/ui-text";
import type { BlogPost } from "@/payload-types";
import { BlogGrid, Heading } from "@poynt/ui";

interface RelatedPostsProps {
  /** Relaterte innlegg (populert med `depth ≥ 2` på forelderen). */
  posts: BlogPost[];
  title?: string;
}

/**
 * «Relaterte innlegg»-seksjon. Gjenbruker `BlogGrid` + `toBlogCard` slik at
 * kortene ser identiske ut med bloggoversikten — ingen egen kort-JSX.
 */
export function RelatedPosts({
  posts,
  title = SECTION_TITLES.relatedPosts,
}: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <aside className="mt-16 border-border border-t pt-10">
      <Heading size="h2" color="foreground" customStyles="mb-8">
        {title}
      </Heading>
      <BlogGrid posts={posts.map(toBlogCard)} featureFirst={false} />
    </aside>
  );
}
