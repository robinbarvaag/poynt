/**
 * Fyll inn `canonical_email` på On Poynt-brukere som mangler den.
 *
 * Kontoer Better Auth opprettet selv (før registrering ble stengt) fikk tom
 * canonical_email, og godkjenning/Stripe-sync slo opp på nettopp det feltet.
 * Oppslagene tåler nå tom verdi (lib/membership/find-user-by-email.ts), men
 * ryddige rader gjør oppslagene raskere og «Kontakter»-visningen riktig.
 *
 *   bun apps/web/scripts/backfill-canonical-email.ts          (tørrkjøring)
 *   bun apps/web/scripts/backfill-canonical-email.ts apply    (skriv)
 */
import { db, eq, onPoyntUser } from "@poynt/on-poynt-db";
import { canonicalizeEmail } from "@poynt/utils/email-normalize";

async function main() {
  const apply = process.argv.includes("apply");

  const users = await db
    .select({ id: onPoyntUser.id, email: onPoyntUser.email })
    .from(onPoyntUser)
    .where(eq(onPoyntUser.canonicalEmail, ""));

  console.log(
    `${users.length} bruker(e) mangler canonical_email${apply ? "" : " (tørrkjøring — legg til «apply» for å skrive)"}`
  );

  for (const user of users) {
    const canonical = canonicalizeEmail(user.email);
    console.log(`  ${user.email} → ${canonical}`);
    if (apply) {
      await db
        .update(onPoyntUser)
        .set({ canonicalEmail: canonical })
        .where(eq(onPoyntUser.id, user.id));
    }
  }

  console.log(apply ? "Ferdig." : "Ingenting skrevet.");
  process.exit(0);
}

await main();
