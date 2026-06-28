import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "product_settings_benefits" CASCADE;
  DROP TABLE "product_settings" CASCADE;
  ALTER TABLE "products" DROP COLUMN "benefits";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "product_settings_benefits" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"key" varchar NOT NULL
  );
  
  CREATE TABLE "product_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ADD COLUMN "benefits" jsonb;
  ALTER TABLE "product_settings_benefits" ADD CONSTRAINT "product_settings_benefits_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."product_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "product_settings_benefits_order_idx" ON "product_settings_benefits" USING btree ("_order");
  CREATE INDEX "product_settings_benefits_parent_id_idx" ON "product_settings_benefits" USING btree ("_parent_id");`)
}
