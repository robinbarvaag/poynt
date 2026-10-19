/**
 * Slett testbestillingene fra før lanseringen: alt opprettet til og med
 * 12. september 2026 (norsk tid). Bestillinger kan ikke slettes fra admin
 * (`delete: () => false`), derfor dette skriptet.
 *
 * Går rett på SQL, så det virker også før migrasjonen som legger til
 * `orders_items.name`. Postgres sletter varelinjer og låse-rader selv
 * (ON DELETE CASCADE).
 *
 *   bun run --cwd apps/web payload run scripts/delete-test-orders.ts         (tørrkjøring)
 *   bun run --cwd apps/web payload run scripts/delete-test-orders.ts apply   (slett)
 */
import config from "@payload-config";
import { sql } from "@payloadcms/db-postgres";
import { getPayload } from "payload";

/** Første tidspunkt som BEHOLDES: 13. september 2026 kl. 00:00 i Oslo (UTC+2). */
const KEEP_FROM = "2026-09-12T22:00:00.000Z";

type Row = {
  id: number;
  customer_email: string | null;
  total: number | null;
  status: string;
  payment_provider: string;
  created_at: string;
};

async function main() {
  const apply = process.argv.includes("apply");
  const payload = await getPayload({ config });
  const db = payload.db.drizzle;

  const { rows } = await db.execute<Row>(sql`
    SELECT id, customer_email, total, status, payment_provider, created_at
    FROM orders
    WHERE created_at < ${KEEP_FROM}::timestamptz
    ORDER BY created_at
  `);

  for (const row of rows) {
    console.log(
      `#${row.id}  ${String(row.created_at).slice(0, 10)}  ${row.status.padEnd(9)} ${row.payment_provider.padEnd(6)} ${String(row.total ?? "")} kr  ${row.customer_email ?? "(uten e-post)"}`
    );
  }

  if (!apply) {
    console.log(
      `${rows.length} bestilling(er) ville blitt slettet. Legg til «apply» for å slette.`
    );
    process.exit(0);
  }

  const result = await db.execute(sql`
    DELETE FROM orders WHERE created_at < ${KEEP_FROM}::timestamptz
  `);
  console.log(`Slettet ${result.rowCount ?? rows.length} bestilling(er).`);
  process.exit(0);
}

await main();
