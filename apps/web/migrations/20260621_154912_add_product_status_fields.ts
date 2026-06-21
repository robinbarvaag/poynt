import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_status_badge" AS ENUM('none', 'new', 'presale', 'soldout', 'custom');
  ALTER TABLE "products" ADD COLUMN "status_badge" "enum_products_status_badge" DEFAULT 'none';
  ALTER TABLE "products" ADD COLUMN "status_badge_label" varchar;
  ALTER TABLE "products" ADD COLUMN "notice" varchar;
  ALTER TABLE "products" ADD COLUMN "apply_url" varchar DEFAULT '/kontakt';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "status_badge";
  ALTER TABLE "products" DROP COLUMN "status_badge_label";
  ALTER TABLE "products" DROP COLUMN "notice";
  ALTER TABLE "products" DROP COLUMN "apply_url";
  DROP TYPE "public"."enum_products_status_badge";`)
}
