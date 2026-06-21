import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_services_archive_selection_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum__pages_v_blocks_services_archive_selection_mode" AS ENUM('auto', 'manual');
  CREATE TYPE "public"."enum_homepage_blocks_services_archive_selection_mode" AS ENUM('auto', 'manual');
  ALTER TABLE "pages_blocks_services_archive" ADD COLUMN "selection_mode" "enum_pages_blocks_services_archive_selection_mode" DEFAULT 'auto';
  ALTER TABLE "pages_blocks_services_archive" ADD COLUMN "limit" numeric;
  ALTER TABLE "pages_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "_pages_v_blocks_services_archive" ADD COLUMN "selection_mode" "enum__pages_v_blocks_services_archive_selection_mode" DEFAULT 'auto';
  ALTER TABLE "_pages_v_blocks_services_archive" ADD COLUMN "limit" numeric;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "homepage_blocks_services_archive" ADD COLUMN "selection_mode" "enum_homepage_blocks_services_archive_selection_mode" DEFAULT 'auto';
  ALTER TABLE "homepage_blocks_services_archive" ADD COLUMN "limit" numeric;
  ALTER TABLE "homepage_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_rels" ADD CONSTRAINT "homepage_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_services_id_idx" ON "pages_rels" USING btree ("services_id");
  CREATE INDEX "_pages_v_rels_services_id_idx" ON "_pages_v_rels" USING btree ("services_id");
  CREATE INDEX "homepage_rels_services_id_idx" ON "homepage_rels" USING btree ("services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_services_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_services_fk";
  
  ALTER TABLE "homepage_rels" DROP CONSTRAINT "homepage_rels_services_fk";
  
  DROP INDEX "pages_rels_services_id_idx";
  DROP INDEX "_pages_v_rels_services_id_idx";
  DROP INDEX "homepage_rels_services_id_idx";
  ALTER TABLE "pages_blocks_services_archive" DROP COLUMN "selection_mode";
  ALTER TABLE "pages_blocks_services_archive" DROP COLUMN "limit";
  ALTER TABLE "pages_rels" DROP COLUMN "services_id";
  ALTER TABLE "_pages_v_blocks_services_archive" DROP COLUMN "selection_mode";
  ALTER TABLE "_pages_v_blocks_services_archive" DROP COLUMN "limit";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "services_id";
  ALTER TABLE "homepage_blocks_services_archive" DROP COLUMN "selection_mode";
  ALTER TABLE "homepage_blocks_services_archive" DROP COLUMN "limit";
  ALTER TABLE "homepage_rels" DROP COLUMN "services_id";
  DROP TYPE "public"."enum_pages_blocks_services_archive_selection_mode";
  DROP TYPE "public"."enum__pages_v_blocks_services_archive_selection_mode";
  DROP TYPE "public"."enum_homepage_blocks_services_archive_selection_mode";`)
}
