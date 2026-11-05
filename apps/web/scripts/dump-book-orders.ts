/** Kun lesing: nettbutikk-ordrer de siste dagene, for avstemming mot Boksalg. */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });
const since = new Date(Date.now() - 3 * 864e5).toISOString();
const { docs } = await payload.find({
  collection: "orders",
  where: { createdAt: { greater_than: since } },
  limit: 200,
  depth: 0,
  sort: "createdAt",
});
for (const o of docs) {
  const items = (o.items ?? [])
    .map((i) => `${i.quantity ?? 1}× ${i.name ?? i.product}`)
    .join(", ");
  console.log(`${o.createdAt}  ${o.status}  ${o.paymentProvider}  ${items}`);
}
console.log(`${docs.length} ordrer siden ${since.slice(0, 10)}`);
process.exit(0);
