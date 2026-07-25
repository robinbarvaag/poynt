import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_orders_payment_provider" AS ENUM('stripe', 'vipps');
  ALTER TABLE "orders" ALTER COLUMN "customer_email" DROP NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "payment_provider" "enum_orders_payment_provider" DEFAULT 'stripe' NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "vipps_reference" varchar;
  CREATE INDEX "orders_vipps_reference_idx" ON "orders" USING btree ("vipps_reference");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "orders_vipps_reference_idx";
  ALTER TABLE "orders" ALTER COLUMN "customer_email" SET NOT NULL;
  ALTER TABLE "orders" DROP COLUMN "payment_provider";
  ALTER TABLE "orders" DROP COLUMN "vipps_reference";
  DROP TYPE "public"."enum_orders_payment_provider";`)
}
