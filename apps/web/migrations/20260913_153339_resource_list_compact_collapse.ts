import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_resource_list_layout" ADD VALUE 'compact' BEFORE 'list';
  ALTER TYPE "public"."enum__pages_v_blocks_resource_list_layout" ADD VALUE 'compact' BEFORE 'list';
  ALTER TYPE "public"."enum_homepage_blocks_resource_list_layout" ADD VALUE 'compact' BEFORE 'list';
  ALTER TABLE "pages_blocks_resource_list" ADD COLUMN "collapse" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_resource_list" ADD COLUMN "collapse" boolean DEFAULT true;
  ALTER TABLE "homepage_blocks_resource_list" ADD COLUMN "collapse" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_resource_list" DROP COLUMN "collapse";
  ALTER TABLE "_pages_v_blocks_resource_list" DROP COLUMN "collapse";
  ALTER TABLE "homepage_blocks_resource_list" DROP COLUMN "collapse";
  UPDATE "public"."pages_blocks_resource_list" SET "layout" = 'grid' WHERE "layout" = 'compact';
  UPDATE "public"."_pages_v_blocks_resource_list" SET "layout" = 'grid' WHERE "layout" = 'compact';
  UPDATE "public"."homepage_blocks_resource_list" SET "layout" = 'grid' WHERE "layout" = 'compact';
  ALTER TABLE "public"."pages_blocks_resource_list" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."_pages_v_blocks_resource_list" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."homepage_blocks_resource_list" ALTER COLUMN "layout" DROP DEFAULT;
  ALTER TABLE "public"."pages_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_resource_list_layout";
  CREATE TYPE "public"."enum_pages_blocks_resource_list_layout" AS ENUM('grid', 'list');
  ALTER TABLE "public"."pages_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_pages_blocks_resource_list_layout" USING "layout"::"public"."enum_pages_blocks_resource_list_layout";
  ALTER TABLE "public"."_pages_v_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_layout";
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_layout" AS ENUM('grid', 'list');
  ALTER TABLE "public"."_pages_v_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE "public"."enum__pages_v_blocks_resource_list_layout" USING "layout"::"public"."enum__pages_v_blocks_resource_list_layout";
  ALTER TABLE "public"."homepage_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_blocks_resource_list_layout";
  CREATE TYPE "public"."enum_homepage_blocks_resource_list_layout" AS ENUM('grid', 'list');
  ALTER TABLE "public"."homepage_blocks_resource_list" ALTER COLUMN "layout" SET DATA TYPE "public"."enum_homepage_blocks_resource_list_layout" USING "layout"::"public"."enum_homepage_blocks_resource_list_layout";
  ALTER TABLE "public"."pages_blocks_resource_list" ALTER COLUMN "layout" SET DEFAULT 'grid';
  ALTER TABLE "public"."_pages_v_blocks_resource_list" ALTER COLUMN "layout" SET DEFAULT 'grid';
  ALTER TABLE "public"."homepage_blocks_resource_list" ALTER COLUMN "layout" SET DEFAULT 'grid';`)
}
