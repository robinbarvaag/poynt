import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_pages_v_blocks_product_archive" DROP CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_products_id_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_id_media_id_fk";
  
  ALTER TABLE "_courses_v_version_modules_lessons_resources" DROP CONSTRAINT "_courses_v_version_modules_lessons_resources_file_id_media_id_fk";
  
  ALTER TABLE "homepage_blocks_product_archive" DROP CONSTRAINT "homepage_blocks_product_archive_featured_product_id_products_id_fk";
  
  ALTER TABLE "_pages_v_blocks_product_archive" ADD CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_ab44f90d_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_i_5b34359a_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons_resources" ADD CONSTRAINT "_courses_v_version_modules_lessons_resources_file_i_f36e02a8_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_archive" ADD CONSTRAINT "homepage_blocks_product_archive_featured_product_id_b23b7703_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_pages_v_blocks_product_archive" DROP CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_ab44f90d_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_i_5b34359a_fk";
  
  ALTER TABLE "_courses_v_version_modules_lessons_resources" DROP CONSTRAINT "_courses_v_version_modules_lessons_resources_file_i_f36e02a8_fk";
  
  ALTER TABLE "homepage_blocks_product_archive" DROP CONSTRAINT "homepage_blocks_product_archive_featured_product_id_b23b7703_fk";
  
  ALTER TABLE "_pages_v_blocks_product_archive" ADD CONSTRAINT "_pages_v_blocks_product_archive_featured_product_id_products_id_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons_resources" ADD CONSTRAINT "_courses_v_version_modules_lessons_resources_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_archive" ADD CONSTRAINT "homepage_blocks_product_archive_featured_product_id_products_id_fk" FOREIGN KEY ("featured_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;`)
}
