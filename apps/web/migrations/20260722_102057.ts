import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_case_studies_meta_og_type" AS ENUM('website', 'article', 'product');
  CREATE TYPE "public"."enum_case_studies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__case_studies_v_version_meta_og_type" AS ENUM('website', 'article', 'product');
  CREATE TYPE "public"."enum__case_studies_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "case_studies_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "case_studies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"customer" varchar,
  	"excerpt" varchar,
  	"featured_image_id" integer,
  	"content" jsonb,
  	"quote_text" varchar,
  	"quote_author" varchar,
  	"quote_role" varchar,
  	"published_at" timestamp(3) with time zone,
  	"quality_score" numeric,
  	"quality_reviewed_at" timestamp(3) with time zone,
  	"quality_review" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"meta_canonical_url" varchar,
  	"meta_og_type" "enum_case_studies_meta_og_type" DEFAULT 'website',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_case_studies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_case_studies_v_version_results" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_case_studies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_customer" varchar,
  	"version_excerpt" varchar,
  	"version_featured_image_id" integer,
  	"version_content" jsonb,
  	"version_quote_text" varchar,
  	"version_quote_author" varchar,
  	"version_quote_role" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_quality_score" numeric,
  	"version_quality_reviewed_at" timestamp(3) with time zone,
  	"version_quality_review" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_meta_canonical_url" varchar,
  	"version_meta_og_type" "enum__case_studies_v_version_meta_og_type" DEFAULT 'website',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__case_studies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  ALTER TABLE "redirects_rels" ADD COLUMN "case_studies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "case_studies_id" integer;
  ALTER TABLE "case_studies_results" ADD CONSTRAINT "case_studies_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v_version_results" ADD CONSTRAINT "_case_studies_v_version_results_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_case_studies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_case_studies_v" ADD CONSTRAINT "_case_studies_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "case_studies_results_order_idx" ON "case_studies_results" USING btree ("_order");
  CREATE INDEX "case_studies_results_parent_id_idx" ON "case_studies_results" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "case_studies_slug_idx" ON "case_studies" USING btree ("slug");
  CREATE INDEX "case_studies_featured_image_idx" ON "case_studies" USING btree ("featured_image_id");
  CREATE INDEX "case_studies_meta_meta_image_idx" ON "case_studies" USING btree ("meta_image_id");
  CREATE INDEX "case_studies_updated_at_idx" ON "case_studies" USING btree ("updated_at");
  CREATE INDEX "case_studies_created_at_idx" ON "case_studies" USING btree ("created_at");
  CREATE INDEX "case_studies__status_idx" ON "case_studies" USING btree ("_status");
  CREATE INDEX "_case_studies_v_version_results_order_idx" ON "_case_studies_v_version_results" USING btree ("_order");
  CREATE INDEX "_case_studies_v_version_results_parent_id_idx" ON "_case_studies_v_version_results" USING btree ("_parent_id");
  CREATE INDEX "_case_studies_v_parent_idx" ON "_case_studies_v" USING btree ("parent_id");
  CREATE INDEX "_case_studies_v_version_version_slug_idx" ON "_case_studies_v" USING btree ("version_slug");
  CREATE INDEX "_case_studies_v_version_version_featured_image_idx" ON "_case_studies_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_case_studies_v_version_meta_version_meta_image_idx" ON "_case_studies_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_case_studies_v_version_version_updated_at_idx" ON "_case_studies_v" USING btree ("version_updated_at");
  CREATE INDEX "_case_studies_v_version_version_created_at_idx" ON "_case_studies_v" USING btree ("version_created_at");
  CREATE INDEX "_case_studies_v_version_version__status_idx" ON "_case_studies_v" USING btree ("version__status");
  CREATE INDEX "_case_studies_v_created_at_idx" ON "_case_studies_v" USING btree ("created_at");
  CREATE INDEX "_case_studies_v_updated_at_idx" ON "_case_studies_v" USING btree ("updated_at");
  CREATE INDEX "_case_studies_v_latest_idx" ON "_case_studies_v" USING btree ("latest");
  CREATE INDEX "_case_studies_v_autosave_idx" ON "_case_studies_v" USING btree ("autosave");
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_case_studies_id_idx" ON "redirects_rels" USING btree ("case_studies_id");
  CREATE INDEX "payload_locked_documents_rels_case_studies_id_idx" ON "payload_locked_documents_rels" USING btree ("case_studies_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "case_studies_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "case_studies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v_version_results" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_case_studies_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "case_studies_results" CASCADE;
  DROP TABLE "case_studies" CASCADE;
  DROP TABLE "_case_studies_v_version_results" CASCADE;
  DROP TABLE "_case_studies_v" CASCADE;
  ALTER TABLE "redirects_rels" DROP CONSTRAINT "redirects_rels_case_studies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_case_studies_fk";
  
  DROP INDEX "redirects_rels_case_studies_id_idx";
  DROP INDEX "payload_locked_documents_rels_case_studies_id_idx";
  ALTER TABLE "redirects_rels" DROP COLUMN "case_studies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "case_studies_id";
  DROP TYPE "public"."enum_case_studies_meta_og_type";
  DROP TYPE "public"."enum_case_studies_status";
  DROP TYPE "public"."enum__case_studies_v_version_meta_og_type";
  DROP TYPE "public"."enum__case_studies_v_version_status";`)
}
