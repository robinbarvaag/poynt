import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Legger til «forhandssalg» i saleSource — forhåndssalg er en egen ting å føre
 * enn et vanlig innkjøp, og «Annet» skjulte det.
 *
 * Merk: generatoren ville her ha gjentatt hele diffen fra 20260922_195239 og
 * _195240, fordi de er håndskrevne og ikke har egne drizzle-snapshots. De er
 * allerede kjørt, så denne fila er trimmet ned til det som faktisk mangler.
 * Snapshotet 20260922_200457.json beskriver riktig sluttilstand og er beholdt,
 * så neste `migrate:create` regner ut diffen fra riktig utgangspunkt.
 *
 * Den nye verdien BRUKES ikke her (standardverdien er fortsatt «innkjop»), så
 * denne kan trygt stå alene i én transaksjon — i motsetning til _195239.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_sales_sale_source" ADD VALUE 'forhandssalg' BEFORE 'avregning';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" DROP DEFAULT;
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_sales_sale_source";
  CREATE TYPE "public"."enum_book_sales_sale_source" AS ENUM('innkjop', 'avregning', 'foredrag', 'direkte', 'annet');
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE "public"."enum_book_sales_sale_source" USING "sale_source"::"public"."enum_book_sales_sale_source";
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DEFAULT 'innkjop';`)
}
