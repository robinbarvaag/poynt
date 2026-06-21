import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "products_variant_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"price_delta" numeric
  );
  
  ALTER TABLE "products" ADD COLUMN "allow_quantity" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "variant_label" varchar;
  ALTER TABLE "orders_items" ADD COLUMN "quantity" numeric DEFAULT 1 NOT NULL;
  ALTER TABLE "orders_items" ADD COLUMN "variant" varchar;
  ALTER TABLE "products_variant_options" ADD CONSTRAINT "products_variant_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_variant_options_order_idx" ON "products_variant_options" USING btree ("_order");
  CREATE INDEX "products_variant_options_parent_id_idx" ON "products_variant_options" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_variant_options" CASCADE;
  ALTER TABLE "products" DROP COLUMN "allow_quantity";
  ALTER TABLE "products" DROP COLUMN "variant_label";
  ALTER TABLE "orders_items" DROP COLUMN "quantity";
  ALTER TABLE "orders_items" DROP COLUMN "variant";`)
}
