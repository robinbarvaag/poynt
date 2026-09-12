import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_company_knows_about" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"topic" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_company_founder_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ADD COLUMN "company_legal_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_org_number" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_founding_date" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_area_served" varchar DEFAULT 'Norge';
  ALTER TABLE "site_settings" ADD COLUMN "company_slogan" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_founder_name" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_founder_job_title" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_founder_description" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "company_founder_image_id" integer;
  ALTER TABLE "site_settings_company_knows_about" ADD CONSTRAINT "site_settings_company_knows_about_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_company_founder_same_as" ADD CONSTRAINT "site_settings_company_founder_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_company_knows_about_order_idx" ON "site_settings_company_knows_about" USING btree ("_order");
  CREATE INDEX "site_settings_company_knows_about_parent_id_idx" ON "site_settings_company_knows_about" USING btree ("_parent_id");
  CREATE INDEX "site_settings_company_founder_same_as_order_idx" ON "site_settings_company_founder_same_as" USING btree ("_order");
  CREATE INDEX "site_settings_company_founder_same_as_parent_id_idx" ON "site_settings_company_founder_same_as" USING btree ("_parent_id");
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_company_founder_image_id_media_id_fk" FOREIGN KEY ("company_founder_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_company_founder_company_founder_image_idx" ON "site_settings" USING btree ("company_founder_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_company_knows_about" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_company_founder_same_as" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_settings_company_knows_about" CASCADE;
  DROP TABLE "site_settings_company_founder_same_as" CASCADE;
  ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_company_founder_image_id_media_id_fk";
  
  DROP INDEX "site_settings_company_founder_company_founder_image_idx";
  ALTER TABLE "site_settings" DROP COLUMN "company_legal_name";
  ALTER TABLE "site_settings" DROP COLUMN "company_org_number";
  ALTER TABLE "site_settings" DROP COLUMN "company_founding_date";
  ALTER TABLE "site_settings" DROP COLUMN "company_area_served";
  ALTER TABLE "site_settings" DROP COLUMN "company_slogan";
  ALTER TABLE "site_settings" DROP COLUMN "company_founder_name";
  ALTER TABLE "site_settings" DROP COLUMN "company_founder_job_title";
  ALTER TABLE "site_settings" DROP COLUMN "company_founder_description";
  ALTER TABLE "site_settings" DROP COLUMN "company_founder_image_id";`)
}
