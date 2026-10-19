import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "requires_shipping" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "requires_shipping" boolean DEFAULT false;
  ALTER TABLE "orders" ADD COLUMN "shipping_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_line1" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_line2" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_postal_code" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_city" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_country" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_phone" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "requires_shipping";
  ALTER TABLE "orders" DROP COLUMN "requires_shipping";
  ALTER TABLE "orders" DROP COLUMN "shipping_name";
  ALTER TABLE "orders" DROP COLUMN "shipping_line1";
  ALTER TABLE "orders" DROP COLUMN "shipping_line2";
  ALTER TABLE "orders" DROP COLUMN "shipping_postal_code";
  ALTER TABLE "orders" DROP COLUMN "shipping_city";
  ALTER TABLE "orders" DROP COLUMN "shipping_country";
  ALTER TABLE "orders" DROP COLUMN "shipping_phone";`)
}
