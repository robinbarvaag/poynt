import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_product_archive" ADD COLUMN "featured_product_id" integer;
  ALTER TABLE "pages_blocks_product_archive" ADD COLUMN "feature_first" boolean DEFAULT false;
  ALTER TABLE "_pages_v_blocks_product_archive" ADD COLUMN "featured_product_id" integer;
  ALTER TABLE "_pages_v_blocks_product_archive" ADD COLUMN "feature_first" boolean DEFAULT false;
  ALTER TABLE "homepage_blocks_product_archive" ADD COLUMN "featured_product_id" integer;
  ALTER TABLE "homepage_blocks_product_archive" ADD COLUMN "feature_first" boolean DEFAULT false;
  ALTER TABLE "pages_blocks_product_archive" ADD CONSTRAINT "pages_blocks_product_archive_featured_product_id_products_id_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_product_archive" ADD CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_products_id_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_archive" ADD CONSTRAINT "homepage_blocks_product_archive_featured_product_id_products_id_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_product_archive_featured_product_idx" ON "pages_blocks_product_archive" USING btree ("featured_product_id");
  CREATE INDEX "_pages_v_blocks_product_archive_featured_product_idx" ON "_pages_v_blocks_product_archive" USING btree ("featured_product_id");
  CREATE INDEX "homepage_blocks_product_archive_featured_product_idx" ON "homepage_blocks_product_archive" USING btree ("featured_product_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_product_archive" DROP CONSTRAINT "pages_blocks_product_archive_featured_product_id_products_id_fk";
  
  ALTER TABLE "_pages_v_blocks_product_archive" DROP CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_products_id_fk";
  
  ALTER TABLE "homepage_blocks_product_archive" DROP CONSTRAINT "homepage_blocks_product_archive_featured_product_id_products_id_fk";
  
  DROP INDEX "pages_blocks_product_archive_featured_product_idx";
  DROP INDEX "_pages_v_blocks_product_archive_featured_product_idx";
  DROP INDEX "homepage_blocks_product_archive_featured_product_idx";
  ALTER TABLE "pages_blocks_product_archive" DROP COLUMN "featured_product_id";
  ALTER TABLE "pages_blocks_product_archive" DROP COLUMN "feature_first";
  ALTER TABLE "_pages_v_blocks_product_archive" DROP COLUMN "featured_product_id";
  ALTER TABLE "_pages_v_blocks_product_archive" DROP COLUMN "feature_first";
  ALTER TABLE "homepage_blocks_product_archive" DROP COLUMN "featured_product_id";
  ALTER TABLE "homepage_blocks_product_archive" DROP COLUMN "feature_first";`)
}
