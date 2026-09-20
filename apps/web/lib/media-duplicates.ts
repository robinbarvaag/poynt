import { SIMILAR_THRESHOLD, hammingDistance } from "@/lib/media-hash";
import type { Payload } from "payload";

/**
 * Finner dubletter i mediebiblioteket ved å gruppere på fingeravtrykkene fra
 * `lib/media-hash.ts`. To bilder havner i samme gruppe hvis de enten er
 * nøyaktig samme fil (`contentHash`) eller samme motiv (`perceptualHash`
 * innenfor terskelen) — sistnevnte fanger opp det samme bildet lagret på nytt
 * i en annen størrelse eller et annet format.
 *
 * Gruppene bygges med union-find, slik at tre varianter av samme motiv blir én
 * gruppe og ikke tre parvise treff.
 */

export type DuplicateItem = {
  alt: null | string;
  createdAt: null | string;
  filename: null | string;
  filesize: null | number;
  id: number;
  thumbnailUrl: null | string;
};

export type DuplicateGroup = {
  /** «identisk» = samme fil, «lignende» = samme motiv i ulik utgave. */
  kind: "identisk" | "lignende";
  items: DuplicateItem[];
};

type HashedDoc = {
  contentHash?: null | string;
  createdAt?: null | string;
  filename?: null | string;
  filesize?: null | number;
  id: number;
  alt?: null | string;
  mimeType?: null | string;
  perceptualHash?: null | string;
  sizes?: null | { thumbnail?: null | { url?: null | string } };
  thumbnailURL?: null | string;
};

/** Så mange mediedokumenter vi sammenligner. Godt over dagens bibliotek. */
const SCAN_LIMIT = 5000;

class UnionFind {
  private parent: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, i) => i);
  }

  find(a: number): number {
    let root = a;
    while (this.parent[root] !== root) root = this.parent[root] as number;
    // Stikomprimering, så gjentatte oppslag blir billige.
    let cursor = a;
    while (this.parent[cursor] !== root) {
      const next = this.parent[cursor] as number;
      this.parent[cursor] = root;
      cursor = next;
    }
    return root;
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) this.parent[rootB] = rootA;
  }
}

export async function findDuplicateMedia(
  payload: Payload
): Promise<DuplicateGroup[]> {
  const { docs } = await payload.find({
    collection: "media",
    depth: 0,
    limit: SCAN_LIMIT,
    pagination: false,
    sort: "createdAt",
  });

  const candidates = (docs as HashedDoc[]).filter(
    (doc) => doc.contentHash || doc.perceptualHash
  );
  if (candidates.length < 2) return [];

  const groups = new UnionFind(candidates.length);

  // 1. Nøyaktig samme fil.
  const byContent = new Map<string, number>();
  for (const [index, doc] of candidates.entries()) {
    if (!doc.contentHash) continue;
    const seen = byContent.get(doc.contentHash);
    if (seen === undefined) byContent.set(doc.contentHash, index);
    else groups.union(seen, index);
  }

  // 2. Samme motiv. O(n²), men på et bibliotek i denne størrelsen er det et
  // par millioner billige nibble-sammenligninger — godt under et sekund.
  const withPerceptual = candidates
    .map((doc, index) => ({ doc, index }))
    .filter((entry) => Boolean(entry.doc.perceptualHash));

  for (let i = 0; i < withPerceptual.length; i++) {
    for (let j = i + 1; j < withPerceptual.length; j++) {
      const a = withPerceptual[i];
      const b = withPerceptual[j];
      if (!a || !b) continue;
      const distance = hammingDistance(
        a.doc.perceptualHash as string,
        b.doc.perceptualHash as string
      );
      if (distance <= SIMILAR_THRESHOLD) groups.union(a.index, b.index);
    }
  }

  const byRoot = new Map<number, number[]>();
  for (let index = 0; index < candidates.length; index++) {
    const root = groups.find(index);
    const members = byRoot.get(root) ?? [];
    members.push(index);
    byRoot.set(root, members);
  }

  const result: DuplicateGroup[] = [];
  for (const members of byRoot.values()) {
    if (members.length < 2) continue;

    const docsInGroup = members.map((index) => candidates[index] as HashedDoc);
    const hashes = new Set(
      docsInGroup.map((doc) => doc.contentHash ?? `mangler-${doc.id}`)
    );

    result.push({
      kind: hashes.size === 1 ? "identisk" : "lignende",
      items: docsInGroup.map((doc) => ({
        alt: doc.alt ?? null,
        createdAt: doc.createdAt ?? null,
        filename: doc.filename ?? null,
        filesize: doc.filesize ?? null,
        id: doc.id,
        thumbnailUrl: doc.thumbnailURL ?? doc.sizes?.thumbnail?.url ?? null,
      })),
    });
  }

  // Identiske filer først — de er de trygge å rydde i.
  return result.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "identisk" ? -1 : 1;
    return b.items.length - a.items.length;
  });
}
