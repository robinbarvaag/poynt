import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_shipping_status" AS ENUM('pending', 'shipped');
  ALTER TABLE "orders" ADD COLUMN "shipping_status" "enum_orders_shipping_status";
  ALTER TABLE "orders" ADD COLUMN "shipped_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "shipping_note" varchar;
  UPDATE "orders" SET "shipping_status" = 'pending' WHERE "requires_shipping" = true AND "shipping_status" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN "shipping_status";
  ALTER TABLE "orders" DROP COLUMN "shipped_at";
  ALTER TABLE "orders" DROP COLUMN "shipping_note";
  DROP TYPE "public"."enum_orders_shipping_status";`)
}
