import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header" DROP COLUMN "show_search";
  ALTER TABLE "header" DROP COLUMN "show_login";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "header" ADD COLUMN "show_search" boolean DEFAULT true;
  ALTER TABLE "header" ADD COLUMN "show_login" boolean DEFAULT true;`)
}
