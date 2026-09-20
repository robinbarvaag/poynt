/**
 * Leser (kun leser) publisert vs. utkast for forslags-siden, så vi ser hvilken
 * versjon som har lenkene i VEKST-sjekken.
 *
 *   bun run --cwd apps/web payload run scripts/tmp-inspect-forslag.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });
const SLUG = "verdifull-vekst-universet-nye-elementer-forslag-hjbsemej";

type Row = {
  name?: string | null;
  letter?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
};

for (const draft of [false, true]) {
  const res = await payload.find({
    collection: "pages",
    where: { slug: { equals: SLUG } },
    draft,
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  const page = res.docs[0];
  if (!page) {
    console.log(`${draft ? "UTKAST" : "PUBLISERT"}: fant ingen side`);
    continue;
  }
  const block = ((page.layout ?? []) as { blockType?: string }[]).find(
    (b) => b.blockType === "vekstCheck"
  ) as { pillars?: Row[] } | undefined;
  console.log(
    `\n${draft ? "UTKAST" : "PUBLISERT"}  _status=${(page as { _status?: string })._status}  oppdatert=${page.updatedAt}`
  );
  for (const row of block?.pillars ?? []) {
    console.log(
      `  ${(row.name ?? row.letter ?? "?").padEnd(10)} lenketekst:${JSON.stringify(row.linkLabel ?? null)}  lenke:${JSON.stringify(row.linkUrl ?? null)}`
    );
  }
}

process.exit(0);
