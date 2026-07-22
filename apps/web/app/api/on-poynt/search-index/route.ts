import config from "@/payload.config";
import { auth } from "@poynt/planner-auth/server";
import { type NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

export type SearchIndexItem = {
  title: string;
  href: string;
  format: "guide" | "kurs";
};

/**
 * Lett søkeindeks for det globale søket (⌘K): alt publisert Læring-innhold
 * (guider, kurs) som tittel + lenke. Hentes lazy første gang paletten
 * åpnes og caches på klienten. Auth-gated som resten av on-poynt.
 */
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await getPayload({ config });
    const published = { _status: { equals: "published" } } as const;
    const [guides, courses] = await Promise.all([
      payload.find({
        collection: "guides",
        where: published,
        depth: 0,
        limit: 300,
        select: { title: true, slug: true },
      }),
      payload.find({
        collection: "courses",
        where: published,
        depth: 0,
        limit: 300,
        select: { title: true, slug: true },
      }),
    ]);

    const items: SearchIndexItem[] = [
      ...guides.docs.map((g) => ({
        title: g.title,
        href: `/on-poynt/ressurser/${g.slug}`,
        format: "guide" as const,
      })),
      ...courses.docs.map((c) => ({
        title: c.title,
        href: `/on-poynt/kurs/${c.slug}`,
        format: "kurs" as const,
      })),
    ];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search index failed:", error);
    return NextResponse.json({ items: [] });
  }
}
