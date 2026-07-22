import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "pages" ADD COLUMN "quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "quality_review" jsonb;
  ALTER TABLE "_pages_v" ADD COLUMN "version_quality_score" numeric;
  ALTER TABLE "_pages_v" ADD COLUMN "version_quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_quality_review" jsonb;
  ALTER TABLE "blog_posts" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "blog_posts" ADD COLUMN "quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "blog_posts" ADD COLUMN "quality_review" jsonb;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_quality_score" numeric;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_quality_review" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP COLUMN "quality_score";
  ALTER TABLE "pages" DROP COLUMN "quality_reviewed_at";
  ALTER TABLE "pages" DROP COLUMN "quality_review";
  ALTER TABLE "_pages_v" DROP COLUMN "version_quality_score";
  ALTER TABLE "_pages_v" DROP COLUMN "version_quality_reviewed_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_quality_review";
  ALTER TABLE "blog_posts" DROP COLUMN "quality_score";
  ALTER TABLE "blog_posts" DROP COLUMN "quality_reviewed_at";
  ALTER TABLE "blog_posts" DROP COLUMN "quality_review";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_quality_score";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_quality_reviewed_at";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_quality_review";`)
}
