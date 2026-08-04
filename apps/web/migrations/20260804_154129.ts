import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_product_archive" DROP COLUMN "layout";
  ALTER TABLE "_pages_v_blocks_product_archive" DROP COLUMN "layout";
  ALTER TABLE "homepage_blocks_product_archive" DROP COLUMN "layout";
  DROP TYPE "public"."enum_pages_blocks_product_archive_layout";
  DROP TYPE "public"."enum__pages_v_blocks_product_archive_layout";
  DROP TYPE "public"."enum_homepage_blocks_product_archive_layout";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  CREATE TYPE "public"."enum__pages_v_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  CREATE TYPE "public"."enum_homepage_blocks_product_archive_layout" AS ENUM('grid', 'grid-4', 'carousel');
  ALTER TABLE "pages_blocks_product_archive" ADD COLUMN "layout" "enum_pages_blocks_product_archive_layout" DEFAULT 'grid';
  ALTER TABLE "_pages_v_blocks_product_archive" ADD COLUMN "layout" "enum__pages_v_blocks_product_archive_layout" DEFAULT 'grid';
  ALTER TABLE "homepage_blocks_product_archive" ADD COLUMN "layout" "enum_homepage_blocks_product_archive_layout" DEFAULT 'grid';`)
}
