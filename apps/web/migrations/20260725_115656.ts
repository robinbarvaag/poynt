import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ALTER COLUMN "pdf_preview_title" SET DEFAULT 'Ta en titt inni';
  ALTER TABLE "products" ADD COLUMN "videos_title" varchar DEFAULT 'Se og hør';
  ALTER TABLE "products" ADD COLUMN "videos_intro" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ALTER COLUMN "pdf_preview_title" SET DEFAULT 'Ta ein titt inni';
  ALTER TABLE "products" DROP COLUMN "videos_title";
  ALTER TABLE "products" DROP COLUMN "videos_intro";`)
}
