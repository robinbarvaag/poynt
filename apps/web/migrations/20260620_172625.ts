import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_product_archive_filter_by_type" ADD VALUE 'product' BEFORE 'course';
  ALTER TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type" ADD VALUE 'product' BEFORE 'course';
  ALTER TYPE "public"."enum_products_type" ADD VALUE 'product' BEFORE 'course';
  ALTER TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type" ADD VALUE 'product' BEFORE 'course';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."pages_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_product_archive_filter_by_type";
  CREATE TYPE "public"."enum_pages_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  ALTER TABLE "public"."pages_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE "public"."enum_pages_blocks_product_archive_filter_by_type" USING "filter_by_type"::"public"."enum_pages_blocks_product_archive_filter_by_type";
  ALTER TABLE "public"."_pages_v_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type";
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  ALTER TABLE "public"."_pages_v_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE "public"."enum__pages_v_blocks_product_archive_filter_by_type" USING "filter_by_type"::"public"."enum__pages_v_blocks_product_archive_filter_by_type";
  ALTER TABLE "public"."products" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_products_type";
  CREATE TYPE "public"."enum_products_type" AS ENUM('course', 'pdf', 'bundle', 'membership');
  ALTER TABLE "public"."products" ALTER COLUMN "type" SET DATA TYPE "public"."enum_products_type" USING "type"::"public"."enum_products_type";
  ALTER TABLE "public"."homepage_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type";
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type" AS ENUM('all', 'course', 'pdf', 'bundle');
  ALTER TABLE "public"."homepage_blocks_product_archive" ALTER COLUMN "filter_by_type" SET DATA TYPE "public"."enum_homepage_blocks_product_archive_filter_by_type" USING "filter_by_type"::"public"."enum_homepage_blocks_product_archive_filter_by_type";`)
}
