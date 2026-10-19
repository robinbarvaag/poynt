import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_sales_sale_source" ADD VALUE 'hyllesalg' BEFORE 'retur';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_sales_sale_source";
  CREATE TYPE "public"."enum_book_sales_sale_source" AS ENUM('innkjop', 'forhandssalg', 'avregning', 'foredrag', 'direkte', 'retur', 'annet');
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE "public"."enum_book_sales_sale_source" USING "sale_source"::"public"."enum_book_sales_sale_source";`)
}
