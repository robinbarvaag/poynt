import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_events_extra_questions_type" AS ENUM('text', 'textarea', 'checkbox', 'select');
  CREATE TYPE "public"."enum_events_registration_mode" AS ENUM('internal', 'external', 'none');
  CREATE TYPE "public"."enum_events_meta_og_type" AS ENUM('website', 'article', 'product');
  CREATE TYPE "public"."enum_events_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum_events_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__events_v_version_extra_questions_type" AS ENUM('text', 'textarea', 'checkbox', 'select');
  CREATE TYPE "public"."enum__events_v_version_registration_mode" AS ENUM('internal', 'external', 'none');
  CREATE TYPE "public"."enum__events_v_version_meta_og_type" AS ENUM('website', 'article', 'product');
  CREATE TYPE "public"."enum__events_v_version_event_status" AS ENUM('scheduled', 'postponed', 'cancelled');
  CREATE TYPE "public"."enum__events_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_event_registrations_status" AS ENUM('registered', 'waitlisted', 'checked_in', 'cancelled');
  CREATE TYPE "public"."enum_event_registrations_cancelled_by" AS ENUM('self', 'admin');
  ALTER TYPE "public"."enum_newsletter_consents_source" ADD VALUE 'event';
  CREATE TABLE "events_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "events_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "events_extra_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum_events_extra_questions_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"name" varchar
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"excerpt" varchar,
  	"hero_image_id" integer,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"doors_open_at" timestamp(3) with time zone,
  	"location_name" varchar,
  	"location_map_url" varchar,
  	"location_address" varchar,
  	"location_online" boolean DEFAULT false,
  	"description" jsonb,
  	"practical_info" jsonb,
  	"registration_mode" "enum_events_registration_mode" DEFAULT 'internal',
  	"external_url" varchar,
  	"external_label" varchar DEFAULT 'Kjøp billett',
  	"capacity" numeric,
  	"waitlist_enabled" boolean DEFAULT true,
  	"registration_opens_at" timestamp(3) with time zone,
  	"registration_closes_at" timestamp(3) with time zone,
  	"tickets_enabled" boolean DEFAULT true,
  	"newsletter_opt_in" boolean DEFAULT true,
  	"confirmation_message" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"meta_no_index" boolean DEFAULT false,
  	"meta_canonical_url" varchar,
  	"meta_og_type" "enum_events_meta_og_type" DEFAULT 'website',
  	"slug" varchar,
  	"event_status" "enum_events_event_status" DEFAULT 'scheduled',
  	"quality_score" numeric,
  	"quality_reviewed_at" timestamp(3) with time zone,
  	"quality_review" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_events_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "events_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_events_v_version_program" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v_version_extra_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "enum__events_v_version_extra_questions_type" DEFAULT 'text',
  	"required" boolean DEFAULT false,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_events_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_excerpt" varchar,
  	"version_hero_image_id" integer,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_doors_open_at" timestamp(3) with time zone,
  	"version_location_name" varchar,
  	"version_location_map_url" varchar,
  	"version_location_address" varchar,
  	"version_location_online" boolean DEFAULT false,
  	"version_description" jsonb,
  	"version_practical_info" jsonb,
  	"version_registration_mode" "enum__events_v_version_registration_mode" DEFAULT 'internal',
  	"version_external_url" varchar,
  	"version_external_label" varchar DEFAULT 'Kjøp billett',
  	"version_capacity" numeric,
  	"version_waitlist_enabled" boolean DEFAULT true,
  	"version_registration_opens_at" timestamp(3) with time zone,
  	"version_registration_closes_at" timestamp(3) with time zone,
  	"version_tickets_enabled" boolean DEFAULT true,
  	"version_newsletter_opt_in" boolean DEFAULT true,
  	"version_confirmation_message" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_meta_canonical_url" varchar,
  	"version_meta_og_type" "enum__events_v_version_meta_og_type" DEFAULT 'website',
  	"version_slug" varchar,
  	"version_event_status" "enum__events_v_version_event_status" DEFAULT 'scheduled',
  	"version_quality_score" numeric,
  	"version_quality_reviewed_at" timestamp(3) with time zone,
  	"version_quality_review" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__events_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_events_v_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "event_registrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"event_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"status" "enum_event_registrations_status" DEFAULT 'registered' NOT NULL,
  	"code" varchar NOT NULL,
  	"token" varchar NOT NULL,
  	"answers" jsonb,
  	"newsletter" boolean DEFAULT false,
  	"waitlist_position" numeric,
  	"checked_in_at" timestamp(3) with time zone,
  	"checked_in_by_id" integer,
  	"cancelled_at" timestamp(3) with time zone,
  	"cancelled_by" "enum_event_registrations_cancelled_by",
  	"promoted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "redirects_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "event_registrations_id" integer;
  ALTER TABLE "events_program" ADD CONSTRAINT "events_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_faq" ADD CONSTRAINT "events_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_extra_questions" ADD CONSTRAINT "events_extra_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events_texts" ADD CONSTRAINT "events_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_program" ADD CONSTRAINT "_events_v_version_program_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_faq" ADD CONSTRAINT "_events_v_version_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_extra_questions" ADD CONSTRAINT "_events_v_version_extra_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_parent_id_events_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v" ADD CONSTRAINT "_events_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_events_v_texts" ADD CONSTRAINT "_events_v_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_checked_in_by_id_users_id_fk" FOREIGN KEY ("checked_in_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "events_program_order_idx" ON "events_program" USING btree ("_order");
  CREATE INDEX "events_program_parent_id_idx" ON "events_program" USING btree ("_parent_id");
  CREATE INDEX "events_faq_order_idx" ON "events_faq" USING btree ("_order");
  CREATE INDEX "events_faq_parent_id_idx" ON "events_faq" USING btree ("_parent_id");
  CREATE INDEX "events_extra_questions_order_idx" ON "events_extra_questions" USING btree ("_order");
  CREATE INDEX "events_extra_questions_parent_id_idx" ON "events_extra_questions" USING btree ("_parent_id");
  CREATE INDEX "events_hero_image_idx" ON "events" USING btree ("hero_image_id");
  CREATE INDEX "events_meta_meta_image_idx" ON "events" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "events__status_idx" ON "events" USING btree ("_status");
  CREATE INDEX "events_texts_order_parent" ON "events_texts" USING btree ("order","parent_id");
  CREATE INDEX "_events_v_version_program_order_idx" ON "_events_v_version_program" USING btree ("_order");
  CREATE INDEX "_events_v_version_program_parent_id_idx" ON "_events_v_version_program" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_faq_order_idx" ON "_events_v_version_faq" USING btree ("_order");
  CREATE INDEX "_events_v_version_faq_parent_id_idx" ON "_events_v_version_faq" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_extra_questions_order_idx" ON "_events_v_version_extra_questions" USING btree ("_order");
  CREATE INDEX "_events_v_version_extra_questions_parent_id_idx" ON "_events_v_version_extra_questions" USING btree ("_parent_id");
  CREATE INDEX "_events_v_parent_idx" ON "_events_v" USING btree ("parent_id");
  CREATE INDEX "_events_v_version_version_hero_image_idx" ON "_events_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_events_v_version_meta_version_meta_image_idx" ON "_events_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_events_v_version_version_slug_idx" ON "_events_v" USING btree ("version_slug");
  CREATE INDEX "_events_v_version_version_updated_at_idx" ON "_events_v" USING btree ("version_updated_at");
  CREATE INDEX "_events_v_version_version_created_at_idx" ON "_events_v" USING btree ("version_created_at");
  CREATE INDEX "_events_v_version_version__status_idx" ON "_events_v" USING btree ("version__status");
  CREATE INDEX "_events_v_created_at_idx" ON "_events_v" USING btree ("created_at");
  CREATE INDEX "_events_v_updated_at_idx" ON "_events_v" USING btree ("updated_at");
  CREATE INDEX "_events_v_latest_idx" ON "_events_v" USING btree ("latest");
  CREATE INDEX "_events_v_autosave_idx" ON "_events_v" USING btree ("autosave");
  CREATE INDEX "_events_v_texts_order_parent" ON "_events_v_texts" USING btree ("order","parent_id");
  CREATE INDEX "event_registrations_event_idx" ON "event_registrations" USING btree ("event_id");
  CREATE INDEX "event_registrations_email_idx" ON "event_registrations" USING btree ("email");
  CREATE INDEX "event_registrations_status_idx" ON "event_registrations" USING btree ("status");
  CREATE UNIQUE INDEX "event_registrations_code_idx" ON "event_registrations" USING btree ("code");
  CREATE UNIQUE INDEX "event_registrations_token_idx" ON "event_registrations" USING btree ("token");
  CREATE INDEX "event_registrations_checked_in_by_idx" ON "event_registrations" USING btree ("checked_in_by_id");
  CREATE INDEX "event_registrations_updated_at_idx" ON "event_registrations" USING btree ("updated_at");
  CREATE INDEX "event_registrations_created_at_idx" ON "event_registrations" USING btree ("created_at");
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_event_registrations_fk" FOREIGN KEY ("event_registrations_id") REFERENCES "public"."event_registrations"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "redirects_rels_events_id_idx" ON "redirects_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_event_registrations_id_idx" ON "payload_locked_documents_rels" USING btree ("event_registrations_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events_program" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_extra_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_program" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_extra_questions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "event_registrations" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events_program" CASCADE;
  DROP TABLE "events_faq" CASCADE;
  DROP TABLE "events_extra_questions" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "events_texts" CASCADE;
  DROP TABLE "_events_v_version_program" CASCADE;
  DROP TABLE "_events_v_version_faq" CASCADE;
  DROP TABLE "_events_v_version_extra_questions" CASCADE;
  DROP TABLE "_events_v" CASCADE;
  DROP TABLE "_events_v_texts" CASCADE;
  DROP TABLE "event_registrations" CASCADE;
  ALTER TABLE "redirects_rels" DROP CONSTRAINT "redirects_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_event_registrations_fk";
  
  DROP INDEX "redirects_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_event_registrations_id_idx";
  ALTER TABLE "redirects_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "event_registrations_id";
  ALTER TABLE "public"."newsletter_consents" ALTER COLUMN "source" SET DATA TYPE text;
  DROP TYPE "public"."enum_newsletter_consents_source";
  CREATE TYPE "public"."enum_newsletter_consents_source" AS ENUM('newsletter-form', 'book-access', 'checkout', 'receipt', 'membership', 'waitlist');
  ALTER TABLE "public"."newsletter_consents" ALTER COLUMN "source" SET DATA TYPE "public"."enum_newsletter_consents_source" USING "source"::"public"."enum_newsletter_consents_source";
  DROP TYPE "public"."enum_events_extra_questions_type";
  DROP TYPE "public"."enum_events_registration_mode";
  DROP TYPE "public"."enum_events_meta_og_type";
  DROP TYPE "public"."enum_events_event_status";
  DROP TYPE "public"."enum_events_status";
  DROP TYPE "public"."enum__events_v_version_extra_questions_type";
  DROP TYPE "public"."enum__events_v_version_registration_mode";
  DROP TYPE "public"."enum__events_v_version_meta_og_type";
  DROP TYPE "public"."enum__events_v_version_event_status";
  DROP TYPE "public"."enum__events_v_version_status";
  DROP TYPE "public"."enum_event_registrations_status";
  DROP TYPE "public"."enum_event_registrations_cancelled_by";`)
}
