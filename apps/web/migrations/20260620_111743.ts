import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_testimonials_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_columns" AS ENUM('2', '3');
  CREATE TYPE "public"."enum_homepage_blocks_testimonials_columns" AS ENUM('2', '3');
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE varchar USING NULL;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE varchar USING NULL;
  ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE varchar USING NULL;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "intro" varchar;
  ALTER TABLE "pages_blocks_testimonials" ADD COLUMN "columns" "enum_pages_blocks_testimonials_columns" DEFAULT '3';
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "intro" varchar;
  ALTER TABLE "_pages_v_blocks_testimonials" ADD COLUMN "columns" "enum__pages_v_blocks_testimonials_columns" DEFAULT '3';
  ALTER TABLE "homepage_blocks_testimonials" ADD COLUMN "eyebrow" varchar;
  ALTER TABLE "homepage_blocks_testimonials" ADD COLUMN "intro" varchar;
  ALTER TABLE "homepage_blocks_testimonials" ADD COLUMN "columns" "enum_homepage_blocks_testimonials_columns" DEFAULT '3';
  ALTER TABLE "public"."pages_blocks_testimonials" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."pages_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_testimonials_layout";
  CREATE TYPE "public"."enum_pages_blocks_testimonials_layout" AS ENUM('cards', 'quote');
  ALTER TABLE "public"."pages_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_pages_blocks_testimonials_layout" USING "layout"::"public"."enum_pages_blocks_testimonials_layout";
  ALTER TABLE "public"."pages_blocks_testimonials" ALTER COLUMN "layout" SET DEFAULT 'cards';
  ALTER TABLE "public"."_pages_v_blocks_testimonials" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."_pages_v_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_layout";
  CREATE TYPE "public"."enum__pages_v_blocks_testimonials_layout" AS ENUM('cards', 'quote');
  ALTER TABLE "public"."_pages_v_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__pages_v_blocks_testimonials_layout" USING "layout"::"public"."enum__pages_v_blocks_testimonials_layout";
  ALTER TABLE "public"."_pages_v_blocks_testimonials" ALTER COLUMN "layout" SET DEFAULT 'cards';
  ALTER TABLE "public"."homepage_blocks_testimonials" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."homepage_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_blocks_testimonials_layout";
  CREATE TYPE "public"."enum_homepage_blocks_testimonials_layout" AS ENUM('cards', 'quote');
  ALTER TABLE "public"."homepage_blocks_testimonials" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_homepage_blocks_testimonials_layout" USING "layout"::"public"."enum_homepage_blocks_testimonials_layout";
  ALTER TABLE "public"."homepage_blocks_testimonials" ALTER COLUMN "layout" SET DEFAULT 'cards';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_testimonials_layout" ADD VALUE 'slider' BEFORE 'quote';
  ALTER TYPE "public"."enum__pages_v_blocks_testimonials_layout" ADD VALUE 'slider' BEFORE 'quote';
  ALTER TYPE "public"."enum_homepage_blocks_testimonials_layout" ADD VALUE 'slider' BEFORE 'quote';
  ALTER TABLE "pages_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE jsonb USING NULL;
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE jsonb USING NULL;
  ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "subtitle" SET DATA TYPE jsonb USING NULL;
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "eyebrow";
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "intro";
  ALTER TABLE "pages_blocks_testimonials" DROP COLUMN "columns";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "eyebrow";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "intro";
  ALTER TABLE "_pages_v_blocks_testimonials" DROP COLUMN "columns";
  ALTER TABLE "homepage_blocks_testimonials" DROP COLUMN "eyebrow";
  ALTER TABLE "homepage_blocks_testimonials" DROP COLUMN "intro";
  ALTER TABLE "homepage_blocks_testimonials" DROP COLUMN "columns";
  DROP TYPE "public"."enum_pages_blocks_testimonials_columns";
  DROP TYPE "public"."enum__pages_v_blocks_testimonials_columns";
  DROP TYPE "public"."enum_homepage_blocks_testimonials_columns";`)
}
