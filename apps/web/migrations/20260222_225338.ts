import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Drop defaults (so we can change column type)
  await db.execute(sql`
    ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" DROP DEFAULT;
    ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" DROP DEFAULT;
    ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "variant" DROP DEFAULT;
  `)

  // 2. Convert columns to text, update data, recreate enums
  await db.execute(sql`
    ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
    ALTER TABLE "public"."homepage_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  `)

  await db.execute(sql`
    UPDATE "pages_blocks_hero" SET "variant" = 'standard' WHERE "variant" NOT IN ('standard', 'fullscreen');
    UPDATE "_pages_v_blocks_hero" SET "variant" = 'standard' WHERE "variant" NOT IN ('standard', 'fullscreen');
    UPDATE "homepage_blocks_hero" SET "variant" = 'standard' WHERE "variant" NOT IN ('standard', 'fullscreen');
  `)

  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_hero_variant";
    CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('standard', 'fullscreen');
    DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_hero_variant";
    CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('standard', 'fullscreen');
    DROP TYPE IF EXISTS "public"."enum_homepage_blocks_hero_variant";
    CREATE TYPE "public"."enum_homepage_blocks_hero_variant" AS ENUM('standard', 'fullscreen');
  `)

  // 3. Cast back to enum and set new defaults
  await db.execute(sql`
    ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_hero_variant" USING "variant"::"public"."enum_pages_blocks_hero_variant";
    ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__pages_v_blocks_hero_variant" USING "variant"::"public"."enum__pages_v_blocks_hero_variant";
    ALTER TABLE "public"."homepage_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_homepage_blocks_hero_variant" USING "variant"::"public"."enum_homepage_blocks_hero_variant";
    ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'standard';
    ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'standard';
    ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'standard';
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'centered';
  ALTER TABLE "_pages_v_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'centered';
  ALTER TABLE "homepage_blocks_hero" ALTER COLUMN "variant" SET DEFAULT 'centered';
  ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_blocks_hero_variant";
  CREATE TYPE "public"."enum_pages_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen', 'gradient');
  ALTER TABLE "public"."pages_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_pages_blocks_hero_variant" USING "variant"::"public"."enum_pages_blocks_hero_variant";
  ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_blocks_hero_variant";
  CREATE TYPE "public"."enum__pages_v_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen', 'gradient');
  ALTER TABLE "public"."_pages_v_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum__pages_v_blocks_hero_variant" USING "variant"::"public"."enum__pages_v_blocks_hero_variant";
  ALTER TABLE "public"."homepage_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE text;
  DROP TYPE "public"."enum_homepage_blocks_hero_variant";
  CREATE TYPE "public"."enum_homepage_blocks_hero_variant" AS ENUM('centered', 'left', 'split', 'fullscreen', 'gradient');
  ALTER TABLE "public"."homepage_blocks_hero" ALTER COLUMN "variant" SET DATA TYPE "public"."enum_homepage_blocks_hero_variant" USING "variant"::"public"."enum_homepage_blocks_hero_variant";`)
}
