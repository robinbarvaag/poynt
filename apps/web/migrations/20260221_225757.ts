import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drop course_content tables if they still exist
  await db.execute(sql`
    DROP TABLE IF EXISTS "course_content_modules_resources" CASCADE;
    DROP TABLE IF EXISTS "course_content_modules" CASCADE;
    DROP TABLE IF EXISTS "course_content" CASCADE;
  `)

  // Remove course_content references from locked_documents_rels (if they exist)
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_course_content_fk";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_course_content_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "course_content_id";
  `)

  // Add new columns to articles
  await db.execute(sql`
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false;
    ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "reading_time" numeric;
    ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_is_featured" boolean DEFAULT false;
    ALTER TABLE "_articles_v" ADD COLUMN IF NOT EXISTS "version_reading_time" numeric;
  `)

  // Add new columns to categories
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "color" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "icon" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "is_featured";
    ALTER TABLE "articles" DROP COLUMN IF EXISTS "reading_time";
    ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_is_featured";
    ALTER TABLE "_articles_v" DROP COLUMN IF EXISTS "version_reading_time";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "color";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "icon";
  `)
}
