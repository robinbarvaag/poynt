import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_countdown_variant" AS ENUM('primary', 'saffron', 'salmon');
  CREATE TYPE "public"."enum_pages_blocks_marquee_surface" AS ENUM('primary', 'saffron', 'salmon', 'mint', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_marquee_speed" AS ENUM('slow', 'base', 'fast');
  CREATE TYPE "public"."enum_pages_page_type" AS ENUM('standard', 'landing');
  CREATE TYPE "public"."enum__pages_v_blocks_countdown_variant" AS ENUM('primary', 'saffron', 'salmon');
  CREATE TYPE "public"."enum__pages_v_blocks_marquee_surface" AS ENUM('primary', 'saffron', 'salmon', 'mint', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_marquee_speed" AS ENUM('slow', 'base', 'fast');
  CREATE TYPE "public"."enum__pages_v_version_page_type" AS ENUM('standard', 'landing');
  CREATE TYPE "public"."enum_homepage_blocks_countdown_variant" AS ENUM('primary', 'saffron', 'salmon');
  CREATE TYPE "public"."enum_homepage_blocks_marquee_surface" AS ENUM('primary', 'saffron', 'salmon', 'mint', 'outline');
  CREATE TYPE "public"."enum_homepage_blocks_marquee_speed" AS ENUM('slow', 'base', 'fast');
  CREATE TABLE "pages_blocks_book_hero_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_book_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"cover_id" integer,
  	"form_id" integer,
  	"note" varchar,
  	"show_signup_count" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_countdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"target_date" timestamp(3) with time zone,
  	"done_label" varchar,
  	"cta_text" varchar,
  	"cta_url" varchar,
  	"variant" "enum_pages_blocks_countdown_variant" DEFAULT 'primary',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_marquee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"surface" "enum_pages_blocks_marquee_surface" DEFAULT 'primary',
  	"speed" "enum_pages_blocks_marquee_speed" DEFAULT 'base',
  	"reverse" boolean DEFAULT false,
  	"tilt" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_book_hero_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_book_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"eyebrow" varchar,
  	"title" varchar,
  	"subtitle" varchar,
  	"cover_id" integer,
  	"form_id" integer,
  	"note" varchar,
  	"show_signup_count" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_countdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"target_date" timestamp(3) with time zone,
  	"done_label" varchar,
  	"cta_text" varchar,
  	"cta_url" varchar,
  	"variant" "enum__pages_v_blocks_countdown_variant" DEFAULT 'primary',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_marquee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"surface" "enum__pages_v_blocks_marquee_surface" DEFAULT 'primary',
  	"speed" "enum__pages_v_blocks_marquee_speed" DEFAULT 'base',
  	"reverse" boolean DEFAULT false,
  	"tilt" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_book_hero_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_book_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"badge" varchar,
  	"eyebrow" varchar,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"cover_id" integer,
  	"form_id" integer,
  	"note" varchar,
  	"show_signup_count" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_countdown" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"description" varchar,
  	"target_date" timestamp(3) with time zone NOT NULL,
  	"done_label" varchar,
  	"cta_text" varchar,
  	"cta_url" varchar,
  	"variant" "enum_homepage_blocks_countdown_variant" DEFAULT 'primary',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_marquee_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE "homepage_blocks_marquee" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"surface" "enum_homepage_blocks_marquee_surface" DEFAULT 'primary',
  	"speed" "enum_homepage_blocks_marquee_speed" DEFAULT 'base',
  	"reverse" boolean DEFAULT false,
  	"tilt" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages" ADD COLUMN "page_type" "enum_pages_page_type" DEFAULT 'standard';
  ALTER TABLE "_pages_v" ADD COLUMN "version_page_type" "enum__pages_v_version_page_type" DEFAULT 'standard';
  ALTER TABLE "pages_blocks_book_hero_bullets" ADD CONSTRAINT "pages_blocks_book_hero_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_book_hero" ADD CONSTRAINT "pages_blocks_book_hero_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_book_hero" ADD CONSTRAINT "pages_blocks_book_hero_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_book_hero" ADD CONSTRAINT "pages_blocks_book_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_countdown" ADD CONSTRAINT "pages_blocks_countdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_marquee_items" ADD CONSTRAINT "pages_blocks_marquee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_marquee" ADD CONSTRAINT "pages_blocks_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_book_hero_bullets" ADD CONSTRAINT "_pages_v_blocks_book_hero_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD CONSTRAINT "_pages_v_blocks_book_hero_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD CONSTRAINT "_pages_v_blocks_book_hero_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD CONSTRAINT "_pages_v_blocks_book_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_countdown" ADD CONSTRAINT "_pages_v_blocks_countdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_marquee_items" ADD CONSTRAINT "_pages_v_blocks_marquee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_marquee" ADD CONSTRAINT "_pages_v_blocks_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_hero_bullets" ADD CONSTRAINT "homepage_blocks_book_hero_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_hero" ADD CONSTRAINT "homepage_blocks_book_hero_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_hero" ADD CONSTRAINT "homepage_blocks_book_hero_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_hero" ADD CONSTRAINT "homepage_blocks_book_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_countdown" ADD CONSTRAINT "homepage_blocks_countdown_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_marquee_items" ADD CONSTRAINT "homepage_blocks_marquee_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_marquee"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_marquee" ADD CONSTRAINT "homepage_blocks_marquee_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_book_hero_bullets_order_idx" ON "pages_blocks_book_hero_bullets" USING btree ("_order");
  CREATE INDEX "pages_blocks_book_hero_bullets_parent_id_idx" ON "pages_blocks_book_hero_bullets" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_book_hero_order_idx" ON "pages_blocks_book_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_book_hero_parent_id_idx" ON "pages_blocks_book_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_book_hero_path_idx" ON "pages_blocks_book_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_book_hero_cover_idx" ON "pages_blocks_book_hero" USING btree ("cover_id");
  CREATE INDEX "pages_blocks_book_hero_form_idx" ON "pages_blocks_book_hero" USING btree ("form_id");
  CREATE INDEX "pages_blocks_countdown_order_idx" ON "pages_blocks_countdown" USING btree ("_order");
  CREATE INDEX "pages_blocks_countdown_parent_id_idx" ON "pages_blocks_countdown" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_countdown_path_idx" ON "pages_blocks_countdown" USING btree ("_path");
  CREATE INDEX "pages_blocks_marquee_items_order_idx" ON "pages_blocks_marquee_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_marquee_items_parent_id_idx" ON "pages_blocks_marquee_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_marquee_order_idx" ON "pages_blocks_marquee" USING btree ("_order");
  CREATE INDEX "pages_blocks_marquee_parent_id_idx" ON "pages_blocks_marquee" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_marquee_path_idx" ON "pages_blocks_marquee" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_book_hero_bullets_order_idx" ON "_pages_v_blocks_book_hero_bullets" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_book_hero_bullets_parent_id_idx" ON "_pages_v_blocks_book_hero_bullets" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_book_hero_order_idx" ON "_pages_v_blocks_book_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_book_hero_parent_id_idx" ON "_pages_v_blocks_book_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_book_hero_path_idx" ON "_pages_v_blocks_book_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_book_hero_cover_idx" ON "_pages_v_blocks_book_hero" USING btree ("cover_id");
  CREATE INDEX "_pages_v_blocks_book_hero_form_idx" ON "_pages_v_blocks_book_hero" USING btree ("form_id");
  CREATE INDEX "_pages_v_blocks_countdown_order_idx" ON "_pages_v_blocks_countdown" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_countdown_parent_id_idx" ON "_pages_v_blocks_countdown" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_countdown_path_idx" ON "_pages_v_blocks_countdown" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_marquee_items_order_idx" ON "_pages_v_blocks_marquee_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_marquee_items_parent_id_idx" ON "_pages_v_blocks_marquee_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_marquee_order_idx" ON "_pages_v_blocks_marquee" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_marquee_parent_id_idx" ON "_pages_v_blocks_marquee" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_marquee_path_idx" ON "_pages_v_blocks_marquee" USING btree ("_path");
  CREATE INDEX "homepage_blocks_book_hero_bullets_order_idx" ON "homepage_blocks_book_hero_bullets" USING btree ("_order");
  CREATE INDEX "homepage_blocks_book_hero_bullets_parent_id_idx" ON "homepage_blocks_book_hero_bullets" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_book_hero_order_idx" ON "homepage_blocks_book_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_book_hero_parent_id_idx" ON "homepage_blocks_book_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_book_hero_path_idx" ON "homepage_blocks_book_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_book_hero_cover_idx" ON "homepage_blocks_book_hero" USING btree ("cover_id");
  CREATE INDEX "homepage_blocks_book_hero_form_idx" ON "homepage_blocks_book_hero" USING btree ("form_id");
  CREATE INDEX "homepage_blocks_countdown_order_idx" ON "homepage_blocks_countdown" USING btree ("_order");
  CREATE INDEX "homepage_blocks_countdown_parent_id_idx" ON "homepage_blocks_countdown" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_countdown_path_idx" ON "homepage_blocks_countdown" USING btree ("_path");
  CREATE INDEX "homepage_blocks_marquee_items_order_idx" ON "homepage_blocks_marquee_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_marquee_items_parent_id_idx" ON "homepage_blocks_marquee_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_marquee_order_idx" ON "homepage_blocks_marquee" USING btree ("_order");
  CREATE INDEX "homepage_blocks_marquee_parent_id_idx" ON "homepage_blocks_marquee" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_marquee_path_idx" ON "homepage_blocks_marquee" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_book_hero_bullets" CASCADE;
  DROP TABLE "pages_blocks_book_hero" CASCADE;
  DROP TABLE "pages_blocks_countdown" CASCADE;
  DROP TABLE "pages_blocks_marquee_items" CASCADE;
  DROP TABLE "pages_blocks_marquee" CASCADE;
  DROP TABLE "_pages_v_blocks_book_hero_bullets" CASCADE;
  DROP TABLE "_pages_v_blocks_book_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_countdown" CASCADE;
  DROP TABLE "_pages_v_blocks_marquee_items" CASCADE;
  DROP TABLE "_pages_v_blocks_marquee" CASCADE;
  DROP TABLE "homepage_blocks_book_hero_bullets" CASCADE;
  DROP TABLE "homepage_blocks_book_hero" CASCADE;
  DROP TABLE "homepage_blocks_countdown" CASCADE;
  DROP TABLE "homepage_blocks_marquee_items" CASCADE;
  DROP TABLE "homepage_blocks_marquee" CASCADE;
  ALTER TABLE "pages" DROP COLUMN "page_type";
  ALTER TABLE "_pages_v" DROP COLUMN "version_page_type";
  DROP TYPE "public"."enum_pages_blocks_countdown_variant";
  DROP TYPE "public"."enum_pages_blocks_marquee_surface";
  DROP TYPE "public"."enum_pages_blocks_marquee_speed";
  DROP TYPE "public"."enum_pages_page_type";
  DROP TYPE "public"."enum__pages_v_blocks_countdown_variant";
  DROP TYPE "public"."enum__pages_v_blocks_marquee_surface";
  DROP TYPE "public"."enum__pages_v_blocks_marquee_speed";
  DROP TYPE "public"."enum__pages_v_version_page_type";
  DROP TYPE "public"."enum_homepage_blocks_countdown_variant";
  DROP TYPE "public"."enum_homepage_blocks_marquee_surface";
  DROP TYPE "public"."enum_homepage_blocks_marquee_speed";`)
}
