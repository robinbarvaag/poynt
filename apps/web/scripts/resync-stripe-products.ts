/**
 * Re-synker alle produkter mot en ny Stripe-konto. Nullstiller `stripeID` og
 * lagrer produktet på nytt — da oppretter Stripe-pluginen et ferskt produkt i
 * kontoen `STRIPE_SECRET_KEY` peker på, og lagrer den nye ID-en på dokumentet.
 * Kjøres typisk én gang etter bytte av Stripe-konto. Idempotent nok: kjøres den
 * på nytt, opprettes produktene enda en gang i Stripe (gamle blir liggende der).
 *
 *   bun run --cwd apps/web payload run scripts/resync-stripe-products.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "products",
  limit: 500,
  depth: 0,
});

payload.logger.info(`Fant ${docs.length} produkter som skal re-synkes.`);

for (const product of docs) {
  const oldId = product.stripeID ?? "ingen";
  const updated = await payload.update({
    collection: "products",
    id: product.id,
    data: { stripeID: null, skipSync: false },
  });

  if (updated.stripeID && updated.stripeID !== product.stripeID) {
    payload.logger.info(`✅ ${product.name}: ${oldId} → ${updated.stripeID}`);
  } else {
    payload.logger.error(
      `⚠️ ${product.name}: fikk ingen ny stripeID — sjekk STRIPE_SECRET_KEY og loggen over.`,
    );
  }
}

payload.logger.info("Ferdig med re-synk mot Stripe.");
process.exit(0);
