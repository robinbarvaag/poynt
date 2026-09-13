import {
  type MediaResource,
  PayloadImage,
  resolveMediaUrl,
} from "@/components/payload-image";
import { ResourceLink } from "@/components/resource-link";
import { ResourceGrid, type ResourceItem, type ResourceKind } from "@poynt/ui";

interface ResourceRow {
  title: string;
  kind: ResourceKind;
  description?: string | null;
  url?: string | null;
  file?: MediaResource | number | null;
  image?: MediaResource | number | null;
  category?: string | null;
  note?: string | null;
  id?: string | null;
}

interface ResourceListBlockProps {
  eyebrow?: string | null;
  title?: string | null;
  intro?: string | null;
  items?: ResourceRow[] | null;
  layout?: "grid" | "compact" | "list" | null;
  columns?: "2" | "3" | "4" | null;
  showFilter?: "auto" | "always" | "never" | null;
  collapse?: boolean | null;
}

/** Mapper Payload-blokken `resourceList` til ResourceGrid i @poynt/ui. */
export function ResourceListBlock({
  eyebrow,
  title,
  intro,
  items,
  layout,
  columns,
  showFilter,
  collapse,
}: ResourceListBlockProps) {
  const mapped: ResourceItem[] = (items ?? [])
    .filter((row) => row.title)
    .map((row) => {
      const fileUrl = row.kind === "file" ? resolveMediaUrl(row.file) : null;
      const href = fileUrl ?? row.url ?? undefined;
      return {
        title: row.title,
        kind: row.kind ?? "link",
        description: row.description ?? undefined,
        href,
        download: Boolean(fileUrl),
        image:
          row.image && typeof row.image === "object" ? (
            <PayloadImage
              media={row.image}
              sizes="(min-width: 1024px) 24rem, 100vw"
            />
          ) : undefined,
        category: row.category ?? undefined,
        note: row.note ?? undefined,
      };
    });

  if (mapped.length === 0) return null;

  const cols = Number(columns ?? "3");

  return (
    <ResourceGrid
      eyebrow={eyebrow ?? undefined}
      title={title ?? undefined}
      intro={intro ?? undefined}
      items={mapped}
      layout={layout ?? "grid"}
      columns={cols === 2 || cols === 4 ? cols : 3}
      collapse={collapse ?? true}
      filter={
        showFilter === "always"
          ? true
          : showFilter === "never"
            ? false
            : undefined
      }
      linkComponent={ResourceLink}
    />
  );
}
