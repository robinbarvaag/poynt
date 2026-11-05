/**
 * Skriver ut alle Boksalg-rader (kun lesing) — til avstemming mot
 * Forlagssentralen.
 *
 *   bun run --cwd apps/web payload run scripts/dump-book-sales.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "book-sales",
  limit: 1000,
  depth: 0,
  sort: "date",
});

const rows = docs.map((d) => ({
  date: String(d.date).slice(0, 10),
  copies: d.copies,
  channel: d.channel,
  source: d.saleSource,
  reference: d.reference ?? "",
  notes: (d.notes ?? "").slice(0, 90),
}));
console.table(rows);

const sums = new Map<string, number>();
for (const r of rows) {
  const key = `${r.channel}/${r.source}`;
  sums.set(key, (sums.get(key) ?? 0) + (r.copies ?? 0));
}
console.log(Object.fromEntries(sums));
process.exit(0);
