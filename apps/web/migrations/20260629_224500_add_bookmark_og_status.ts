import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_bookmark_items" ADD COLUMN "og_status" varchar;
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" ADD COLUMN "og_status" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_bookmark_items" DROP COLUMN "og_status";
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" DROP COLUMN "og_status";`)
}
