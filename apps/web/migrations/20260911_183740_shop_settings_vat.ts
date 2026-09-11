import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_vat_rate" AS ENUM('25', '0');
  CREATE TABLE "shop_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"seller_name" varchar DEFAULT 'Poynt AS' NOT NULL,
  	"org_number" varchar,
  	"vat_registered" boolean DEFAULT true,
  	"address" varchar,
  	"support_email" varchar,
  	"support_phone" varchar,
  	"terms_page_id" integer,
  	"privacy_page_id" integer,
  	"withdrawal_notice" varchar DEFAULT 'Digitalt innhold leveres umiddelbart etter kjøp. Ved å fullføre kjøpet ba du om at leveringen startet med en gang, og du godtok at angreretten dermed bortfaller (angrerettloven § 22 bokstav n). Er noe galt med leveransen, hjelper vi deg selvsagt – ta kontakt.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ADD COLUMN "vat_rate" "enum_products_vat_rate" DEFAULT '25' NOT NULL;
  ALTER TABLE "orders_items" ADD COLUMN "vat_rate" numeric;
  ALTER TABLE "orders" ADD COLUMN "vat_total" numeric;
  ALTER TABLE "orders" ADD COLUMN "terms_accepted" boolean DEFAULT false;
  ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_terms_page_id_pages_id_fk" FOREIGN KEY ("terms_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_privacy_page_id_pages_id_fk" FOREIGN KEY ("privacy_page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "shop_settings_terms_page_idx" ON "shop_settings" USING btree ("terms_page_id");
  CREATE INDEX "shop_settings_privacy_page_idx" ON "shop_settings" USING btree ("privacy_page_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "shop_settings" CASCADE;
  ALTER TABLE "products" DROP COLUMN "vat_rate";
  ALTER TABLE "orders_items" DROP COLUMN "vat_rate";
  ALTER TABLE "orders" DROP COLUMN "vat_total";
  ALTER TABLE "orders" DROP COLUMN "terms_accepted";
  DROP TYPE "public"."enum_products_vat_rate";`)
}
