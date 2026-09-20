import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_change_wheel_plan_layout" AS ENUM('collapsed', 'all', 'focus');
  CREATE TYPE "public"."enum__pages_v_blocks_change_wheel_plan_layout" AS ENUM('collapsed', 'all', 'focus');
  CREATE TYPE "public"."enum_homepage_blocks_change_wheel_plan_layout" AS ENUM('collapsed', 'all', 'focus');
  ALTER TABLE "pages_blocks_change_wheel" ADD COLUMN "plan_layout" "enum_pages_blocks_change_wheel_plan_layout" DEFAULT 'collapsed';
  ALTER TABLE "pages_blocks_change_wheel" ADD COLUMN "strong_note" varchar DEFAULT 'Her har du ikke mye å gå på.';
  ALTER TABLE "_pages_v_blocks_change_wheel" ADD COLUMN "plan_layout" "enum__pages_v_blocks_change_wheel_plan_layout" DEFAULT 'collapsed';
  ALTER TABLE "_pages_v_blocks_change_wheel" ADD COLUMN "strong_note" varchar DEFAULT 'Her har du ikke mye å gå på.';
  ALTER TABLE "homepage_blocks_change_wheel" ADD COLUMN "plan_layout" "enum_homepage_blocks_change_wheel_plan_layout" DEFAULT 'collapsed';
  ALTER TABLE "homepage_blocks_change_wheel" ADD COLUMN "strong_note" varchar DEFAULT 'Her har du ikke mye å gå på.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_change_wheel" DROP COLUMN "plan_layout";
  ALTER TABLE "pages_blocks_change_wheel" DROP COLUMN "strong_note";
  ALTER TABLE "_pages_v_blocks_change_wheel" DROP COLUMN "plan_layout";
  ALTER TABLE "_pages_v_blocks_change_wheel" DROP COLUMN "strong_note";
  ALTER TABLE "homepage_blocks_change_wheel" DROP COLUMN "plan_layout";
  ALTER TABLE "homepage_blocks_change_wheel" DROP COLUMN "strong_note";
  DROP TYPE "public"."enum_pages_blocks_change_wheel_plan_layout";
  DROP TYPE "public"."enum__pages_v_blocks_change_wheel_plan_layout";
  DROP TYPE "public"."enum_homepage_blocks_change_wheel_plan_layout";`)
}
