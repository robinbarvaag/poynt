import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "book_economy_channels_presale_kickback_tiers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"copies" numeric,
  	"percent" numeric
  );
  
  ALTER TABLE "book_sales" ADD COLUMN "signed_copies" numeric;
  ALTER TABLE "book_sales" ADD COLUMN "personally_signed_copies" numeric;
  ALTER TABLE "book_economy_channels" ADD COLUMN "presale_enabled" boolean DEFAULT false;
  ALTER TABLE "book_economy_channels" ADD COLUMN "presale_link" varchar;
  ALTER TABLE "book_economy_channels" ADD COLUMN "presale_retailer_percent" numeric DEFAULT 45;
  ALTER TABLE "book_economy_channels" ADD COLUMN "presale_marketing_package_at" numeric DEFAULT 500;
  ALTER TABLE "book_economy_channels" ADD COLUMN "presale_kickback_until" timestamp(3) with time zone;
  ALTER TABLE "book_economy_channels_presale_kickback_tiers" ADD CONSTRAINT "book_economy_channels_presale_kickback_tiers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."book_economy_channels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "book_economy_channels_presale_kickback_tiers_order_idx" ON "book_economy_channels_presale_kickback_tiers" USING btree ("_order");
  CREATE INDEX "book_economy_channels_presale_kickback_tiers_parent_id_idx" ON "book_economy_channels_presale_kickback_tiers" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "book_economy_channels_presale_kickback_tiers" CASCADE;
  ALTER TABLE "book_sales" DROP COLUMN "signed_copies";
  ALTER TABLE "book_sales" DROP COLUMN "personally_signed_copies";
  ALTER TABLE "book_economy_channels" DROP COLUMN "presale_enabled";
  ALTER TABLE "book_economy_channels" DROP COLUMN "presale_link";
  ALTER TABLE "book_economy_channels" DROP COLUMN "presale_retailer_percent";
  ALTER TABLE "book_economy_channels" DROP COLUMN "presale_marketing_package_at";
  ALTER TABLE "book_economy_channels" DROP COLUMN "presale_kickback_until";`)
}
