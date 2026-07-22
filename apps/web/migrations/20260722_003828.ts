import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_stats_band_layout" AS ENUM('band', 'split');
  CREATE TYPE "public"."enum__pages_v_blocks_stats_band_layout" AS ENUM('band', 'split');
  CREATE TYPE "public"."enum_homepage_blocks_stats_band_layout" AS ENUM('band', 'split');
  ALTER TABLE "pages_blocks_stats_band" ADD COLUMN "layout" "enum_pages_blocks_stats_band_layout" DEFAULT 'band';
  ALTER TABLE "pages_blocks_stats_band" ADD COLUMN "description" varchar;
  ALTER TABLE "pages_blocks_stats_band" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "pages_blocks_stats_band" ADD COLUMN "cta_url" varchar;
  ALTER TABLE "_pages_v_blocks_stats_band" ADD COLUMN "layout" "enum__pages_v_blocks_stats_band_layout" DEFAULT 'band';
  ALTER TABLE "_pages_v_blocks_stats_band" ADD COLUMN "description" varchar;
  ALTER TABLE "_pages_v_blocks_stats_band" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "_pages_v_blocks_stats_band" ADD COLUMN "cta_url" varchar;
  ALTER TABLE "homepage_blocks_stats_band" ADD COLUMN "layout" "enum_homepage_blocks_stats_band_layout" DEFAULT 'band';
  ALTER TABLE "homepage_blocks_stats_band" ADD COLUMN "description" varchar;
  ALTER TABLE "homepage_blocks_stats_band" ADD COLUMN "cta_text" varchar;
  ALTER TABLE "homepage_blocks_stats_band" ADD COLUMN "cta_url" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_stats_band" DROP COLUMN "layout";
  ALTER TABLE "pages_blocks_stats_band" DROP COLUMN "description";
  ALTER TABLE "pages_blocks_stats_band" DROP COLUMN "cta_text";
  ALTER TABLE "pages_blocks_stats_band" DROP COLUMN "cta_url";
  ALTER TABLE "_pages_v_blocks_stats_band" DROP COLUMN "layout";
  ALTER TABLE "_pages_v_blocks_stats_band" DROP COLUMN "description";
  ALTER TABLE "_pages_v_blocks_stats_band" DROP COLUMN "cta_text";
  ALTER TABLE "_pages_v_blocks_stats_band" DROP COLUMN "cta_url";
  ALTER TABLE "homepage_blocks_stats_band" DROP COLUMN "layout";
  ALTER TABLE "homepage_blocks_stats_band" DROP COLUMN "description";
  ALTER TABLE "homepage_blocks_stats_band" DROP COLUMN "cta_text";
  ALTER TABLE "homepage_blocks_stats_band" DROP COLUMN "cta_url";
  DROP TYPE "public"."enum_pages_blocks_stats_band_layout";
  DROP TYPE "public"."enum__pages_v_blocks_stats_band_layout";
  DROP TYPE "public"."enum_homepage_blocks_stats_band_layout";`)
}
