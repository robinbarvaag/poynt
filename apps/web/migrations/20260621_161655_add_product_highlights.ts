import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_servicespage_detail_cta_variant" AS ENUM('simple', 'colored');
  CREATE TABLE "products_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "servicespage" ADD COLUMN "detail_cta_variant" "enum_servicespage_detail_cta_variant" DEFAULT 'colored';
  ALTER TABLE "servicespage" ADD COLUMN "detail_cta_title" varchar DEFAULT 'Interessert?';
  ALTER TABLE "servicespage" ADD COLUMN "detail_cta_description" varchar DEFAULT 'Ta kontakt for en uforpliktende prat om hvordan vi kan hjelpe deg.';
  ALTER TABLE "servicespage" ADD COLUMN "detail_cta_primary_cta_text" varchar DEFAULT 'Ta kontakt';
  ALTER TABLE "servicespage" ADD COLUMN "detail_cta_primary_cta_url" varchar DEFAULT '/kontakt';
  ALTER TABLE "products_highlights" ADD CONSTRAINT "products_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_highlights_order_idx" ON "products_highlights" USING btree ("_order");
  CREATE INDEX "products_highlights_parent_id_idx" ON "products_highlights" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "products_highlights" CASCADE;
  ALTER TABLE "servicespage" DROP COLUMN "detail_cta_variant";
  ALTER TABLE "servicespage" DROP COLUMN "detail_cta_title";
  ALTER TABLE "servicespage" DROP COLUMN "detail_cta_description";
  ALTER TABLE "servicespage" DROP COLUMN "detail_cta_primary_cta_text";
  ALTER TABLE "servicespage" DROP COLUMN "detail_cta_primary_cta_url";
  DROP TYPE "public"."enum_servicespage_detail_cta_variant";`)
}
