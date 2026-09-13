import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Ordrenummer = orders.id. Boktilgang-sjekken (lib/book-access.ts) krever
 * minst 4–5 sifre, så poynt.no-ordrer må ha nummer fra 10000 og oppover.
 * GREATEST: flytter aldri sekvensen bakover om det alt finnes høyere id-er.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  SELECT setval(
    pg_get_serial_sequence('"public"."orders"', 'id'),
    GREATEST(10000, (SELECT COALESCE(MAX("id"), 0) + 1 FROM "public"."orders")),
    false
  );`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  SELECT setval(
    pg_get_serial_sequence('"public"."orders"', 'id'),
    (SELECT COALESCE(MAX("id"), 0) + 1 FROM "public"."orders"),
    false
  );`)
}
