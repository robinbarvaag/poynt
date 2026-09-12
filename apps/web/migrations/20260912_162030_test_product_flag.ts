import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "test_product" boolean DEFAULT false;
  CREATE INDEX "products_test_product_idx" ON "products" USING btree ("test_product");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "products_test_product_idx";
  ALTER TABLE "products" DROP COLUMN "test_product";`)
}
