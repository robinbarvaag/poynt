import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_page_type" ADD VALUE 'hub';
  ALTER TYPE "public"."enum__pages_v_version_page_type" ADD VALUE 'hub';
  ALTER TABLE "pages" ADD COLUMN "unlisted" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_unlisted" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "unlisted";
  ALTER TABLE "_pages_v" DROP COLUMN "version_unlisted";
  ALTER TABLE "public"."pages" ALTER COLUMN "page_type" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_page_type";
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('standard', 'landing');
  ALTER TABLE "public"."pages" ALTER COLUMN "page_type" SET DATA TYPE "public"."enum_pages_page_type" USING "page_type"::"public"."enum_pages_page_type";
  ALTER TABLE "public"."_pages_v" ALTER COLUMN "version_page_type" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_version_page_type";
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('standard', 'landing');
  ALTER TABLE "public"."_pages_v" ALTER COLUMN "version_page_type" SET DATA TYPE "public"."enum__pages_v_version_page_type" USING "version_page_type"::"public"."enum__pages_v_version_page_type";`)
}
