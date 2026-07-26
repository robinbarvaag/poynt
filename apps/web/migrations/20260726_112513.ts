import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_services_meta_og_type" AS ENUM('website', 'article', 'product');
  ALTER TABLE "services" ADD COLUMN "meta_canonical_url" varchar;
  ALTER TABLE "services" ADD COLUMN "meta_og_type" "enum_services_meta_og_type" DEFAULT 'website';
  ALTER TABLE "services" ADD COLUMN "quality_score" numeric;
  ALTER TABLE "services" ADD COLUMN "quality_reviewed_at" timestamp(3) with time zone;
  ALTER TABLE "services" ADD COLUMN "quality_review" jsonb;
  ALTER TABLE "redirects_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_services_id_idx" ON "redirects_rels" USING btree ("services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "redirects_rels" DROP CONSTRAINT "redirects_rels_services_fk";
  
  DROP INDEX "redirects_rels_services_id_idx";
  ALTER TABLE "services" DROP COLUMN "meta_canonical_url";
  ALTER TABLE "services" DROP COLUMN "meta_og_type";
  ALTER TABLE "services" DROP COLUMN "quality_score";
  ALTER TABLE "services" DROP COLUMN "quality_reviewed_at";
  ALTER TABLE "services" DROP COLUMN "quality_review";
  ALTER TABLE "redirects_rels" DROP COLUMN "services_id";
  DROP TYPE "public"."enum_services_meta_og_type";`)
}
