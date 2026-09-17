import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_change_wheel_areas" ADD COLUMN "link_pending" boolean;
  ALTER TABLE "_pages_v_blocks_change_wheel_areas" ADD COLUMN "link_pending" boolean;
  ALTER TABLE "homepage_blocks_change_wheel_areas" ADD COLUMN "link_pending" boolean;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_change_wheel_areas" DROP COLUMN "link_pending";
  ALTER TABLE "_pages_v_blocks_change_wheel_areas" DROP COLUMN "link_pending";
  ALTER TABLE "homepage_blocks_change_wheel_areas" DROP COLUMN "link_pending";`)
}
