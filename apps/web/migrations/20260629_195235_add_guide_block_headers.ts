import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_columns" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_columns" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_gallery" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_gallery" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_image" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_image" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_toggle" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_toggle" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_bookmark_items" ADD COLUMN "image_url" varchar;
  ALTER TABLE "guides_blocks_guide_bookmark" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_bookmark" ADD COLUMN "intro" varchar;
  ALTER TABLE "guides_blocks_guide_download" ADD COLUMN "title" varchar;
  ALTER TABLE "guides_blocks_guide_download" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_columns" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_columns" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_gallery" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_gallery" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_image" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_image" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_toggle" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_toggle" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" ADD COLUMN "image_url" varchar;
  ALTER TABLE "_guides_v_blocks_guide_bookmark" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_bookmark" ADD COLUMN "intro" varchar;
  ALTER TABLE "_guides_v_blocks_guide_download" ADD COLUMN "title" varchar;
  ALTER TABLE "_guides_v_blocks_guide_download" ADD COLUMN "intro" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_columns" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_columns" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_gallery" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_gallery" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_image" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_image" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_toggle" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_toggle" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_bookmark_items" DROP COLUMN "image_url";
  ALTER TABLE "guides_blocks_guide_bookmark" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_bookmark" DROP COLUMN "intro";
  ALTER TABLE "guides_blocks_guide_download" DROP COLUMN "title";
  ALTER TABLE "guides_blocks_guide_download" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_columns" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_columns" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_gallery" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_gallery" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_image" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_image" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_toggle" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_toggle" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" DROP COLUMN "image_url";
  ALTER TABLE "_guides_v_blocks_guide_bookmark" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_bookmark" DROP COLUMN "intro";
  ALTER TABLE "_guides_v_blocks_guide_download" DROP COLUMN "title";
  ALTER TABLE "_guides_v_blocks_guide_download" DROP COLUMN "intro";`)
}
