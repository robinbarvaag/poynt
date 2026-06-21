import type { BlogExplorerPost } from "@/components/blog-explorer";
import { PayloadImage } from "@/components/payload-image";
import { formatLongDate } from "@/lib/format";
import {
  resolveMedia,
  resolveMediaUrl,
  resolveRelation,
  resolveRelations,
} from "@/lib/payload";
import type { BlogPost, Category, User } from "@/payload-types";

/**
 * Gjør et (depth ≥ 1) blogginnlegg om til kortdataene `BlogExplorer` trenger.
 * Payload-analogen til en Sanity-projeksjon: all narrowing skjer her, så sidene
 * holder seg rene. Bildet sendes som ferdig `next/image`-slot (appen eier
 * `PayloadImage`); avataren tegnes av kortet fra `authorAvatarUrl`.
 */
export function toBlogCard(post: BlogPost): BlogExplorerPost {
  const cats = resolveRelations<Category>(post.categories);
  const media = resolveMedia(post.featuredImage);
  const author = resolveRelation<User>(post.author);
  const authorName = author?.firstName || author?.email || undefined;

  return {
    id: post.id,
    href: `/blogg/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt ?? undefined,
    category: cats[0]?.name,
    date: formatLongDate(post.publishedAt),
    authorName,
    authorAvatarUrl: resolveMediaUrl(author?.avatar),
    image: media ? (
      <PayloadImage
        media={media}
        alt={media.alt || post.title}
        fill
        className="object-cover transition-transform duration-500 group-hover/post:scale-[1.03]"
      />
    ) : undefined,
    categorySlugs: cats
      .map((cat) => cat.slug)
      .filter((slug): slug is string => Boolean(slug)),
    search: `${post.title} ${post.excerpt ?? ""}`.toLowerCase(),
  };
}
