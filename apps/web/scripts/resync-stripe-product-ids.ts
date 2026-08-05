/**
 * Kobler Payload-produkter til riktig Stripe-produkt igjen.
 *
 * Bakgrunn: hvert produkt lagrer en `stripeID`. Blir Stripe-katalogen slettet
 * og gjenskapt — eller bytter vi Stripe-konto/modus (test ↔ live) — peker de
 * lagrede ID-ene på produkter som ikke lenger finnes. Da feiler ALLE lagringer
 * av produkter i admin med 500, fordi plugin-stripe synker navnet ved hver
 * update og Stripe svarer «No such product».
 *
 * Skriptet matcher på produktnavn (1:1 mot Stripe-katalogen) og skriver
 * `stripeID` på nytt. Idempotent: produkter som allerede peker riktig røres
 * ikke. Kjør på nytt hvis dere bytter Stripe-konto.
 *
 *   bun run --cwd apps/web payload run scripts/resync-stripe-product-ids.ts
 *
 * Legg til `--dry` for å bare se hva som ville blitt endret.
 *
 * NB: top-level await, ikke main()-wrapper — det er mønsteret de andre
 * scriptene her bruker, og det eneste som gir output under `payload run`.
 */
import config from "@payload-config";
import { getStripe } from "@poynt/stripe";
import { getPayload } from "payload";

const DRY = process.argv.includes("--dry");

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("Mangler STRIPE_SECRET_KEY");
const mode = key.startsWith("sk_live") ? "LIVE" : "TEST";

const stripe = getStripe();
const payload = await getPayload({ config });

// Bevisst uten auto-paginering (`for await`) — katalogen er liten nok til at
// én side holder, og auto-pagineringen oppfører seg dårlig under `payload run`.
const stripeProducts = (await stripe.products.list({ limit: 100 })).data;
const byName = new Map(
  stripeProducts.map((p) => [p.name.trim().toLowerCase(), p])
);
const existingIds = new Set(stripeProducts.map((p) => p.id));

const { docs } = await payload.find({
  collection: "products",
  limit: 500,
  depth: 0,
});

const report: string[] = [
  `Stripe-modus: ${mode} — ${stripeProducts.length} produkter i katalogen`,
  `Payload: ${docs.length} produkter`,
  "",
];
let fixed = 0;
let missing = 0;

for (const doc of docs) {
  const d = doc as unknown as {
    id: string | number;
    name?: string;
    stripeID?: string | null;
  };
  const name = d.name ?? "";

  if (d.stripeID && existingIds.has(d.stripeID)) {
    report.push(`OK       ${name} → ${d.stripeID}`);
    continue;
  }

  const match = byName.get(name.trim().toLowerCase());
  if (!match) {
    missing += 1;
    report.push(
      `MANGLER  ${name} — ingen Stripe-produkt med samme navn. Lag det i Stripe, eller tøm stripeID-feltet så lager pluginen det ved neste lagring.`
    );
    continue;
  }

  report.push(`FIKSET   ${name}: ${d.stripeID ?? "(tomt)"} → ${match.id}`);
  fixed += 1;
  if (!DRY) {
    await payload.update({
      collection: "products",
      id: d.id,
      // skipSync: ellers prøver pluginen å pushe til den GAMLE id-en igjen,
      // og vi får nøyaktig den feilen vi holder på å rydde opp i.
      data: { stripeID: match.id, skipSync: true },
      depth: 0,
    });
  }
}

report.push(
  "",
  DRY
    ? `Tørrkjøring: ${fixed} ville blitt fikset, ${missing} uten treff.`
    : `Ferdig: ${fixed} fikset, ${missing} uten treff.`
);
console.info(report.join("\n"));
process.exit(0);
