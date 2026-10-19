/**
 * Rydd opp i eldre bestillinger som ble lagt før forsendelses-flyten og
 * produktnavn-snapshot fantes:
 *
 *  - `requiresShipping` utledes fra produktene («Krever frakt» i admin), så
 *    bokordrer fra før flagget fantes får «Forsendelse» i sidekolonnen og
 *    dukker opp i hurtigfilteret «Skal sendes».
 *  - `items[].name` fylles med produktets nåværende navn der det mangler.
 *
 *   bun run --cwd apps/web payload run scripts/backfill-orders.ts               (tørrkjøring)
 *   bun run --cwd apps/web payload run scripts/backfill-orders.ts apply         (skriv; gamle bokordrer → «Under behandling»)
 *   bun run --cwd apps/web payload run scripts/backfill-orders.ts apply sendt   (skriv; gamle bokordrer → «Sendt» — bruk når de alt er i posten)
 *
 * Kjøres via det lokale API-et uten bruker, så `guardOrderChanges` lar
 * betalingsfeltene passere.
 */
import config from "@payload-config";
import { getPayload } from "payload";

async function main() {
  const apply = process.argv.includes("apply");
  const markShipped = process.argv.includes("sendt");
  const payload = await getPayload({ config });

  const { docs: orders } = await payload.find({
    collection: "orders",
    depth: 1,
    limit: 0,
    pagination: false,
    sort: "createdAt",
  });

  let touched = 0;
  for (const order of orders) {
    const items = order.items ?? [];
    let changed = false;

    const nextItems = items.map((item) => {
      const product = typeof item.product === "object" ? item.product : null;
      if (item.name || !product?.name) return item;
      changed = true;
      return { ...item, name: product.name };
    });

    const needsShipping = items.some(
      (item) =>
        typeof item.product === "object" &&
        item.product.requiresShipping === true
    );
    const flagShipping = needsShipping && order.requiresShipping !== true;
    if (flagShipping) changed = true;

    if (!changed) continue;
    touched += 1;

    const what = [
      flagShipping &&
        `skal sendes → ${markShipped ? "Sendt" : "Under behandling"}`,
      nextItems.some((it, i) => it.name !== items[i]?.name) && "produktnavn",
    ]
      .filter(Boolean)
      .join(", ");
    console.log(
      `#${order.id} ${order.customerEmail ?? "(uten e-post)"} ${order.createdAt.slice(0, 10)}: ${what}`
    );

    if (!apply) continue;
    await payload.update({
      collection: "orders",
      id: order.id,
      depth: 0,
      data: {
        items: nextItems.map((item) => ({
          ...item,
          product:
            typeof item.product === "object" ? item.product.id : item.product,
        })),
        ...(flagShipping && {
          requiresShipping: true,
          shippingStatus: markShipped ? "shipped" : "pending",
        }),
      },
    });
  }

  console.log(
    `${touched} av ${orders.length} bestilling(er) ${apply ? "oppdatert" : "ville blitt oppdatert (legg til «apply» for å skrive)"}.`
  );
  process.exit(0);
}

await main();
