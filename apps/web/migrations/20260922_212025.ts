import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Returrett per kanal + salgstypen «retur». ADD VALUE og ADD COLUMN kan stå i
 * samme transaksjon så lenge den nye enum-verdien ikke BRUKES her (det var
 * fella i _195239/_195240). Eksisterende Norli/ARK-rader får 50 % returrett
 * med en gang, så dashbordet ikke viser null risiko fram til noen husker å
 * fylle ut feltet.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_sales_sale_source" ADD VALUE 'retur' BEFORE 'annet';
  ALTER TABLE "book_economy_channels" ADD COLUMN "max_return_percent" numeric DEFAULT 0;
  UPDATE "book_economy_channels" SET "max_return_percent" = 50 WHERE "key" IN ('norli', 'ark');`)
}

// Nedover må standardverdien på sale_source av før typen kan droppes — den
// avhenger av enum-typen (se MEMORY.md om enum-verdier). Feiler hvis noen rad
// allerede er ført som «retur».
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_economy_channels" DROP COLUMN "max_return_percent";
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" DROP DEFAULT;
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_sales_sale_source";
  CREATE TYPE "public"."enum_book_sales_sale_source" AS ENUM('innkjop', 'forhandssalg', 'avregning', 'foredrag', 'direkte', 'annet');
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DATA TYPE "public"."enum_book_sales_sale_source" USING "sale_source"::"public"."enum_book_sales_sale_source";
  ALTER TABLE "public"."book_sales" ALTER COLUMN "sale_source" SET DEFAULT 'innkjop';`)
}
