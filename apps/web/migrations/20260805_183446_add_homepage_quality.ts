import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "homepage" ADD COLUMN "quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "homepage" ADD COLUMN "quality_review" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "homepage" DROP COLUMN "quality_score";
  ALTER TABLE "homepage" DROP COLUMN "quality_reviewed_at";
  ALTER TABLE "homepage" DROP COLUMN "quality_review";`)
}
