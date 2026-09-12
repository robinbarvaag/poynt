import type { Payload } from "payload";

/**
 * Oversikt over innhold med upubliserte endringer («Klar til publisering»,
 * /admin/upublisert).
 *
 * Alle utkast-collections her kjører med autosave, så hver endring lagres
 * fortløpende som en ny versjon uten å røre den publiserte raden. Da er det
 * lett å gå fra en side uten å trykke Publiser — denne oversikten samler alt
 * slikt på ett sted.
 *
 * Hvordan vi finner det: versjonstabellen har `latest: true` på den nyeste
 * versjonen av hvert dokument. Er den nyeste versjonen et utkast, finnes det
 * endringer som ikke er publisert. Deretter slår vi opp hoveddokumentet for å
 * se om det noen gang er publisert (aldri publisert vs. endret siden sist).
 */

export const DRAFT_COLLECTIONS = [
  "pages",
  "blog-posts",
  "case-studies",
  "services",
  "guides",
  "courses",
] as const;

export type DraftCollectionSlug = (typeof DRAFT_COLLECTIONS)[number];

export const DRAFT_COLLECTION_LABELS: Record<DraftCollectionSlug, string> = {
  pages: "Side",
  "blog-posts": "Blogginnlegg",
  "case-studies": "Kundehistorie",
  services: "Tjeneste",
  guides: "Guide",
  courses: "Kurs",
};

export function isDraftCollection(slug: string): slug is DraftCollectionSlug {
  return (DRAFT_COLLECTIONS as readonly string[]).includes(slug);
}

export interface UnpublishedRow {
  collection: DraftCollectionSlug;
  collectionLabel: string;
  id: string | number;
  title: string;
  slug: string | null;
  /** Aldri publisert, eller publisert men endret etterpå. */
  status: "never-published" | "changed";
  /** Når utkastet sist ble lagret (autosave eller manuelt). */
  draftUpdatedAt: string | null;
  /** Når den publiserte versjonen sist ble oppdatert (null om aldri publisert). */
  publishedAt: string | null;
}

type VersionDoc = {
  parent?: string | number | null;
  updatedAt?: string | null;
  version?: Record<string, unknown> | null;
};

function readString(
  source: Record<string, unknown>,
  key: string
): string | null {
  const value = source[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function rowsForCollection(
  payload: Payload,
  slug: DraftCollectionSlug
): Promise<UnpublishedRow[]> {
  const versions = await payload.findVersions({
    collection: slug,
    depth: 0,
    limit: 500,
    sort: "-updatedAt",
    where: {
      and: [
        { latest: { equals: true } },
        { "version._status": { equals: "draft" } },
      ],
    },
  });

  const drafts = versions.docs as unknown as VersionDoc[];
  const ids = drafts
    .map((doc) => doc.parent)
    .filter((id): id is string | number => id !== null && id !== undefined);
  if (ids.length === 0) return [];

  // Hoveddokumentet holder den publiserte versjonen (utkast bor i
  // versjonstabellen), så _status her forteller om siden noen gang er
  // publisert — og updatedAt når det sist skjedde.
  const published = await payload.find({
    collection: slug,
    depth: 0,
    pagination: false,
    where: { id: { in: ids } },
  });
  const publishedById = new Map(
    published.docs.map((doc) => [
      String((doc as { id: string | number }).id),
      doc as unknown as Record<string, unknown>,
    ])
  );

  const rows: UnpublishedRow[] = [];
  for (const draft of drafts) {
    const id = draft.parent;
    if (id === null || id === undefined) continue;
    const data = (draft.version ?? {}) as Record<string, unknown>;
    const main = publishedById.get(String(id));
    // Dokumentet kan være slettet siden versjonen ble skrevet.
    if (!main) continue;
    const isPublished = main._status === "published";

    rows.push({
      collection: slug,
      collectionLabel: DRAFT_COLLECTION_LABELS[slug],
      id,
      title:
        readString(data, "title") ??
        readString(data, "name") ??
        `Uten tittel (${id})`,
      slug: readString(data, "slug"),
      status: isPublished ? "changed" : "never-published",
      draftUpdatedAt: draft.updatedAt ?? null,
      publishedAt: isPublished
        ? ((main.updatedAt as string | undefined) ?? null)
        : null,
    });
  }
  return rows;
}

export async function getUnpublishedOverview(
  payload: Payload
): Promise<UnpublishedRow[]> {
  const perCollection = await Promise.all(
    DRAFT_COLLECTIONS.map((slug) => rowsForCollection(payload, slug))
  );
  return perCollection
    .flat()
    .sort((a, b) =>
      (b.draftUpdatedAt ?? "").localeCompare(a.draftUpdatedAt ?? "")
    );
}
