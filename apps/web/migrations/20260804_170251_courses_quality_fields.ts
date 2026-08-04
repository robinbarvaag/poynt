import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "courses" ADD COLUMN "quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "courses" ADD COLUMN "quality_review" jsonb;
  ALTER TABLE "_courses_v" ADD COLUMN "version_quality_score" numeric;
  ALTER TABLE "_courses_v" ADD COLUMN "version_quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_courses_v" ADD COLUMN "version_quality_review" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses" DROP COLUMN "quality_score";
  ALTER TABLE "courses" DROP COLUMN "quality_reviewed_at";
  ALTER TABLE "courses" DROP COLUMN "quality_review";
  ALTER TABLE "_courses_v" DROP COLUMN "version_quality_score";
  ALTER TABLE "_courses_v" DROP COLUMN "version_quality_reviewed_at";
  ALTER TABLE "_courses_v" DROP COLUMN "version_quality_review";`)
}
