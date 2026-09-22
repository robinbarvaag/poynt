import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Del 1 av 2: legger til «innkjop» i saleSource-enumet.
 *
 * Postgres tillater ikke at en ny enum-verdi BRUKES i samme transaksjon som den
 * ble lagt til («unsafe use of new value»). Payload kjører hver migrasjonsfil i
 * sin egen transaksjon, så `SET DEFAULT 'innkjop'` og resten av endringene
 * ligger i 20260922_195240 — den kjører etter at denne har committet.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_sales_sale_source" ADD VALUE 'innkjop' BEFORE 'avregning';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" DROP DEFAULT;
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_sales_sale_source";
  CREATE TYPE "public"."enum_book_sales_sale_source" AS ENUM('avregning', 'foredrag', 'direkte', 'annet');
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE "public"."enum_book_sales_sale_source" USING "sale_source"::"public"."enum_book_sales_sale_source";
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DEFAULT 'avregning';`)
}
