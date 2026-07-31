import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_carousel_presentation" AS ENUM('media', 'overlay', 'card');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_presentation" AS ENUM('media', 'overlay', 'card');
  CREATE TYPE "public"."enum_homepage_blocks_carousel_presentation" AS ENUM('media', 'overlay', 'card');
  ALTER TABLE "pages_blocks_carousel" ADD COLUMN "presentation" "enum_pages_blocks_carousel_presentation" DEFAULT 'media';
  ALTER TABLE "_pages_v_blocks_carousel" ADD COLUMN "presentation" "enum__pages_v_blocks_carousel_presentation" DEFAULT 'media';
  ALTER TABLE "homepage_blocks_carousel" ADD COLUMN "presentation" "enum_homepage_blocks_carousel_presentation" DEFAULT 'media';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_carousel" DROP COLUMN "presentation";
  ALTER TABLE "_pages_v_blocks_carousel" DROP COLUMN "presentation";
  ALTER TABLE "homepage_blocks_carousel" DROP COLUMN "presentation";
  DROP TYPE "public"."enum_pages_blocks_carousel_presentation";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_presentation";
  DROP TYPE "public"."enum_homepage_blocks_carousel_presentation";`)
}
