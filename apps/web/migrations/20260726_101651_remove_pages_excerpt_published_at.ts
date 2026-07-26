import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   -- Utdraget var eneste kilde til beskrivelse for de fleste sidene — flytt det
   -- inn i SEO-feltet før kolonnen droppes, så teksten ikke går tapt.
  UPDATE "pages" SET "meta_description" = "excerpt"
    WHERE COALESCE("meta_description", '') = '' AND COALESCE("excerpt", '') <> '';
  UPDATE "_pages_v" SET "version_meta_description" = "version_excerpt"
    WHERE COALESCE("version_meta_description", '') = '' AND COALESCE("version_excerpt", '') <> '';
  ALTER TABLE "pages" DROP COLUMN "excerpt";
  ALTER TABLE "pages" DROP COLUMN "published_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_excerpt";
  ALTER TABLE "_pages_v" DROP COLUMN "version_published_at";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "pages" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_excerpt" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_published_at" timestamp(3) with time zone;`)
}
