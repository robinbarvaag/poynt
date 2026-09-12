import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_product_archive_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_products_delivery_type" AS ENUM('instant', 'standard');
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_layout" AS ENUM('grid', 'carousel');
  ALTER TABLE "pages_blocks_product_archive" ADD COLUMN "layout" "enum_pages_blocks_product_archive_layout" DEFAULT 'grid';
  ALTER TABLE "_pages_v_blocks_product_archive" ADD COLUMN "layout" "enum__pages_v_blocks_product_archive_layout" DEFAULT 'grid';
  ALTER TABLE "products" ADD COLUMN "delivery_type" "enum_products_delivery_type";
  ALTER TABLE "homepage_blocks_product_archive" ADD COLUMN "layout" "enum_homepage_blocks_product_archive_layout" DEFAULT 'grid';
  ALTER TABLE "footer" ADD COLUMN "legal_company_name" varchar DEFAULT 'Poynt AS';
  ALTER TABLE "footer" ADD COLUMN "legal_org_number" varchar;
  ALTER TABLE "footer" ADD COLUMN "legal_address" varchar;
  ALTER TABLE "footer" ADD COLUMN "legal_email" varchar;
  ALTER TABLE "footer" ADD COLUMN "legal_disclaimer" varchar;
  ALTER TABLE "footer" DROP COLUMN "bottom_text";
  -- Til nå har kassen krevd samtykke for ALLE produkter. Eksisterende produkter
  -- beholder derfor den atferden («instant») til redaktøren sier noe annet;
  -- nye produkter må velge eksplisitt (feltet er påkrevd uten standardverdi).
  UPDATE "products" SET "delivery_type" = 'instant' WHERE "delivery_type" IS NULL;
  ALTER TABLE "products" ALTER COLUMN "delivery_type" SET NOT NULL;
  -- Bunnlinjen som tidligere lå som fri rik tekst, nå som egne felt.
  UPDATE "footer" SET
    "legal_company_name" = COALESCE("legal_company_name", 'Poynt AS'),
    "legal_org_number" = COALESCE("legal_org_number", '930 714 151 MVA'),
    "legal_address" = COALESCE("legal_address", 'Ramsvigstien 5A, 4015 Stavanger'),
    "legal_email" = COALESCE("legal_email", 'hei@poynt.no'),
    "legal_disclaimer" = COALESCE("legal_disclaimer", 'Deler av nettsiden og noe innhold er laget med hjelp av KI.');`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "footer" ADD COLUMN "bottom_text" jsonb;
  ALTER TABLE "pages_blocks_product_archive" DROP COLUMN "layout";
  ALTER TABLE "_pages_v_blocks_product_archive" DROP COLUMN "layout";
  ALTER TABLE "products" DROP COLUMN "delivery_type";
  ALTER TABLE "homepage_blocks_product_archive" DROP COLUMN "layout";
  ALTER TABLE "footer" DROP COLUMN "legal_company_name";
  ALTER TABLE "footer" DROP COLUMN "legal_org_number";
  ALTER TABLE "footer" DROP COLUMN "legal_address";
  ALTER TABLE "footer" DROP COLUMN "legal_email";
  ALTER TABLE "footer" DROP COLUMN "legal_disclaimer";
  DROP TYPE "public"."enum_pages_blocks_product_archive_layout";
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_layout";
  DROP TYPE "public"."enum_products_delivery_type";
  DROP TYPE "public"."enum_homepage_blocks_product_archive_layout";`)
}
