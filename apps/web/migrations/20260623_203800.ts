import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_blocks_guide_callout_tone" AS ENUM('mint', 'saffron', 'salmon', 'primary', 'ink');
  CREATE TYPE "public"."enum_guides_blocks_guide_columns_columns_type" AS ENUM('text', 'image');
  CREATE TYPE "public"."enum_guides_blocks_guide_columns_align" AS ENUM('top', 'center');
  CREATE TYPE "public"."enum_guides_blocks_guide_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum_guides_blocks_guide_image_width" AS ENUM('normal', 'wide', 'full');
  CREATE TYPE "public"."enum_guides_blocks_guide_download_items_kind" AS ENUM('pdf', 'canva', 'link', 'other');
  CREATE TYPE "public"."enum_guides_section" AS ENUM('generelt', 'kanaler', 'maler', 'inspirasjon', 'ressurser');
  CREATE TYPE "public"."enum_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_callout_tone" AS ENUM('mint', 'saffron', 'salmon', 'primary', 'ink');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type" AS ENUM('text', 'image');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_columns_align" AS ENUM('top', 'center');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_gallery_layout" AS ENUM('grid', 'carousel');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_image_width" AS ENUM('normal', 'wide', 'full');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_download_items_kind" AS ENUM('pdf', 'canva', 'link', 'other');
  CREATE TYPE "public"."enum__guides_v_version_section" AS ENUM('generelt', 'kanaler', 'maler', 'inspirasjon', 'ressurser');
  CREATE TYPE "public"."enum__guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "guides_blocks_guide_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tone" "enum_guides_blocks_guide_callout_tone" DEFAULT 'mint',
  	"icon" varchar,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_columns_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"type" "enum_guides_blocks_guide_columns_columns_type" DEFAULT 'text',
  	"content" jsonb,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"align" "enum_guides_blocks_guide_columns_align" DEFAULT 'top',
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "enum_guides_blocks_guide_gallery_layout" DEFAULT 'grid',
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum_guides_blocks_guide_image_width" DEFAULT 'normal',
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_toggle_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"content" jsonb
  );
  
  CREATE TABLE "guides_blocks_guide_toggle" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_bookmark_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "guides_blocks_guide_bookmark" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_download_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"kind" "enum_guides_blocks_guide_download_items_kind" DEFAULT 'pdf',
  	"file_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_download" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides_blocks_guide_divider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"icon" varchar,
  	"cover_image_id" integer,
  	"lede" varchar,
  	"section" "enum_guides_section" DEFAULT 'generelt',
  	"category_id" integer,
  	"order" numeric DEFAULT 0,
  	"is_featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "guides_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"guides_id" integer
  );
  
  CREATE TABLE "_guides_v_blocks_guide_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tone" "enum__guides_v_blocks_guide_callout_tone" DEFAULT 'mint',
  	"icon" varchar,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_columns_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum__guides_v_blocks_guide_columns_columns_type" DEFAULT 'text',
  	"content" jsonb,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"align" "enum__guides_v_blocks_guide_columns_align" DEFAULT 'top',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"layout" "enum__guides_v_blocks_guide_gallery_layout" DEFAULT 'grid',
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"width" "enum__guides_v_blocks_guide_image_width" DEFAULT 'normal',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_toggle_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"content" jsonb,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_toggle" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_bookmark_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"title" varchar,
  	"description" varchar,
  	"image_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_bookmark" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_download_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"kind" "enum__guides_v_blocks_guide_download_items_kind" DEFAULT 'pdf',
  	"file_id" integer,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_download" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v_blocks_guide_divider" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_icon" varchar,
  	"version_cover_image_id" integer,
  	"version_lede" varchar,
  	"version_section" "enum__guides_v_version_section" DEFAULT 'generelt',
  	"version_category_id" integer,
  	"version_order" numeric DEFAULT 0,
  	"version_is_featured" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_guides_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"guides_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "guides_id" integer;
  ALTER TABLE "guides_blocks_guide_rich_text" ADD CONSTRAINT "guides_blocks_guide_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_callout" ADD CONSTRAINT "guides_blocks_guide_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD CONSTRAINT "guides_blocks_guide_columns_columns_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD CONSTRAINT "guides_blocks_guide_columns_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_guide_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_columns" ADD CONSTRAINT "guides_blocks_guide_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_gallery_images" ADD CONSTRAINT "guides_blocks_guide_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_gallery_images" ADD CONSTRAINT "guides_blocks_guide_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_guide_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_gallery" ADD CONSTRAINT "guides_blocks_guide_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_image" ADD CONSTRAINT "guides_blocks_guide_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_image" ADD CONSTRAINT "guides_blocks_guide_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_video" ADD CONSTRAINT "guides_blocks_guide_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_toggle_items" ADD CONSTRAINT "guides_blocks_guide_toggle_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_guide_toggle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_toggle" ADD CONSTRAINT "guides_blocks_guide_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_bookmark_items" ADD CONSTRAINT "guides_blocks_guide_bookmark_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_bookmark_items" ADD CONSTRAINT "guides_blocks_guide_bookmark_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_guide_bookmark"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_bookmark" ADD CONSTRAINT "guides_blocks_guide_bookmark_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_download_items" ADD CONSTRAINT "guides_blocks_guide_download_items_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_download_items" ADD CONSTRAINT "guides_blocks_guide_download_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides_blocks_guide_download"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_download" ADD CONSTRAINT "guides_blocks_guide_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_divider" ADD CONSTRAINT "guides_blocks_guide_divider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides" ADD CONSTRAINT "guides_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "guides_rels" ADD CONSTRAINT "guides_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_rich_text" ADD CONSTRAINT "_guides_v_blocks_guide_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_callout" ADD CONSTRAINT "_guides_v_blocks_guide_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_guide_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_gallery_images" ADD CONSTRAINT "_guides_v_blocks_guide_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_gallery_images" ADD CONSTRAINT "_guides_v_blocks_guide_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_guide_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_gallery" ADD CONSTRAINT "_guides_v_blocks_guide_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_image" ADD CONSTRAINT "_guides_v_blocks_guide_image_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_image" ADD CONSTRAINT "_guides_v_blocks_guide_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD CONSTRAINT "_guides_v_blocks_guide_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_toggle_items" ADD CONSTRAINT "_guides_v_blocks_guide_toggle_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_guide_toggle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_toggle" ADD CONSTRAINT "_guides_v_blocks_guide_toggle_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" ADD CONSTRAINT "_guides_v_blocks_guide_bookmark_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" ADD CONSTRAINT "_guides_v_blocks_guide_bookmark_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_guide_bookmark"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_bookmark" ADD CONSTRAINT "_guides_v_blocks_guide_bookmark_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_download_items" ADD CONSTRAINT "_guides_v_blocks_guide_download_items_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_download_items" ADD CONSTRAINT "_guides_v_blocks_guide_download_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v_blocks_guide_download"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_download" ADD CONSTRAINT "_guides_v_blocks_guide_download_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_divider" ADD CONSTRAINT "_guides_v_blocks_guide_divider_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_parent_id_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v" ADD CONSTRAINT "_guides_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_guides_v_rels" ADD CONSTRAINT "_guides_v_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guides_blocks_guide_rich_text_order_idx" ON "guides_blocks_guide_rich_text" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_rich_text_parent_id_idx" ON "guides_blocks_guide_rich_text" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_rich_text_path_idx" ON "guides_blocks_guide_rich_text" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_callout_order_idx" ON "guides_blocks_guide_callout" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_callout_parent_id_idx" ON "guides_blocks_guide_callout" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_callout_path_idx" ON "guides_blocks_guide_callout" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_columns_columns_order_idx" ON "guides_blocks_guide_columns_columns" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_columns_columns_parent_id_idx" ON "guides_blocks_guide_columns_columns" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_columns_columns_image_idx" ON "guides_blocks_guide_columns_columns" USING btree ("image_id");
  CREATE INDEX "guides_blocks_guide_columns_order_idx" ON "guides_blocks_guide_columns" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_columns_parent_id_idx" ON "guides_blocks_guide_columns" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_columns_path_idx" ON "guides_blocks_guide_columns" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_gallery_images_order_idx" ON "guides_blocks_guide_gallery_images" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_gallery_images_parent_id_idx" ON "guides_blocks_guide_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_gallery_images_image_idx" ON "guides_blocks_guide_gallery_images" USING btree ("image_id");
  CREATE INDEX "guides_blocks_guide_gallery_order_idx" ON "guides_blocks_guide_gallery" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_gallery_parent_id_idx" ON "guides_blocks_guide_gallery" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_gallery_path_idx" ON "guides_blocks_guide_gallery" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_image_order_idx" ON "guides_blocks_guide_image" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_image_parent_id_idx" ON "guides_blocks_guide_image" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_image_path_idx" ON "guides_blocks_guide_image" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_image_image_idx" ON "guides_blocks_guide_image" USING btree ("image_id");
  CREATE INDEX "guides_blocks_guide_video_order_idx" ON "guides_blocks_guide_video" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_video_parent_id_idx" ON "guides_blocks_guide_video" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_video_path_idx" ON "guides_blocks_guide_video" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_toggle_items_order_idx" ON "guides_blocks_guide_toggle_items" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_toggle_items_parent_id_idx" ON "guides_blocks_guide_toggle_items" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_toggle_order_idx" ON "guides_blocks_guide_toggle" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_toggle_parent_id_idx" ON "guides_blocks_guide_toggle" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_toggle_path_idx" ON "guides_blocks_guide_toggle" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_bookmark_items_order_idx" ON "guides_blocks_guide_bookmark_items" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_bookmark_items_parent_id_idx" ON "guides_blocks_guide_bookmark_items" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_bookmark_items_image_idx" ON "guides_blocks_guide_bookmark_items" USING btree ("image_id");
  CREATE INDEX "guides_blocks_guide_bookmark_order_idx" ON "guides_blocks_guide_bookmark" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_bookmark_parent_id_idx" ON "guides_blocks_guide_bookmark" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_bookmark_path_idx" ON "guides_blocks_guide_bookmark" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_download_items_order_idx" ON "guides_blocks_guide_download_items" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_download_items_parent_id_idx" ON "guides_blocks_guide_download_items" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_download_items_file_idx" ON "guides_blocks_guide_download_items" USING btree ("file_id");
  CREATE INDEX "guides_blocks_guide_download_order_idx" ON "guides_blocks_guide_download" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_download_parent_id_idx" ON "guides_blocks_guide_download" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_download_path_idx" ON "guides_blocks_guide_download" USING btree ("_path");
  CREATE INDEX "guides_blocks_guide_divider_order_idx" ON "guides_blocks_guide_divider" USING btree ("_order");
  CREATE INDEX "guides_blocks_guide_divider_parent_id_idx" ON "guides_blocks_guide_divider" USING btree ("_parent_id");
  CREATE INDEX "guides_blocks_guide_divider_path_idx" ON "guides_blocks_guide_divider" USING btree ("_path");
  CREATE UNIQUE INDEX "guides_slug_idx" ON "guides" USING btree ("slug");
  CREATE INDEX "guides_cover_image_idx" ON "guides" USING btree ("cover_image_id");
  CREATE INDEX "guides_category_idx" ON "guides" USING btree ("category_id");
  CREATE INDEX "guides_updated_at_idx" ON "guides" USING btree ("updated_at");
  CREATE INDEX "guides_created_at_idx" ON "guides" USING btree ("created_at");
  CREATE INDEX "guides__status_idx" ON "guides" USING btree ("_status");
  CREATE INDEX "guides_rels_order_idx" ON "guides_rels" USING btree ("order");
  CREATE INDEX "guides_rels_parent_idx" ON "guides_rels" USING btree ("parent_id");
  CREATE INDEX "guides_rels_path_idx" ON "guides_rels" USING btree ("path");
  CREATE INDEX "guides_rels_guides_id_idx" ON "guides_rels" USING btree ("guides_id");
  CREATE INDEX "_guides_v_blocks_guide_rich_text_order_idx" ON "_guides_v_blocks_guide_rich_text" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_rich_text_parent_id_idx" ON "_guides_v_blocks_guide_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_rich_text_path_idx" ON "_guides_v_blocks_guide_rich_text" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_callout_order_idx" ON "_guides_v_blocks_guide_callout" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_callout_parent_id_idx" ON "_guides_v_blocks_guide_callout" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_callout_path_idx" ON "_guides_v_blocks_guide_callout" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_columns_columns_order_idx" ON "_guides_v_blocks_guide_columns_columns" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_columns_columns_parent_id_idx" ON "_guides_v_blocks_guide_columns_columns" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_columns_columns_image_idx" ON "_guides_v_blocks_guide_columns_columns" USING btree ("image_id");
  CREATE INDEX "_guides_v_blocks_guide_columns_order_idx" ON "_guides_v_blocks_guide_columns" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_columns_parent_id_idx" ON "_guides_v_blocks_guide_columns" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_columns_path_idx" ON "_guides_v_blocks_guide_columns" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_gallery_images_order_idx" ON "_guides_v_blocks_guide_gallery_images" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_gallery_images_parent_id_idx" ON "_guides_v_blocks_guide_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_gallery_images_image_idx" ON "_guides_v_blocks_guide_gallery_images" USING btree ("image_id");
  CREATE INDEX "_guides_v_blocks_guide_gallery_order_idx" ON "_guides_v_blocks_guide_gallery" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_gallery_parent_id_idx" ON "_guides_v_blocks_guide_gallery" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_gallery_path_idx" ON "_guides_v_blocks_guide_gallery" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_image_order_idx" ON "_guides_v_blocks_guide_image" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_image_parent_id_idx" ON "_guides_v_blocks_guide_image" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_image_path_idx" ON "_guides_v_blocks_guide_image" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_image_image_idx" ON "_guides_v_blocks_guide_image" USING btree ("image_id");
  CREATE INDEX "_guides_v_blocks_guide_video_order_idx" ON "_guides_v_blocks_guide_video" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_video_parent_id_idx" ON "_guides_v_blocks_guide_video" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_video_path_idx" ON "_guides_v_blocks_guide_video" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_toggle_items_order_idx" ON "_guides_v_blocks_guide_toggle_items" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_toggle_items_parent_id_idx" ON "_guides_v_blocks_guide_toggle_items" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_toggle_order_idx" ON "_guides_v_blocks_guide_toggle" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_toggle_parent_id_idx" ON "_guides_v_blocks_guide_toggle" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_toggle_path_idx" ON "_guides_v_blocks_guide_toggle" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_items_order_idx" ON "_guides_v_blocks_guide_bookmark_items" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_items_parent_id_idx" ON "_guides_v_blocks_guide_bookmark_items" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_items_image_idx" ON "_guides_v_blocks_guide_bookmark_items" USING btree ("image_id");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_order_idx" ON "_guides_v_blocks_guide_bookmark" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_parent_id_idx" ON "_guides_v_blocks_guide_bookmark" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_bookmark_path_idx" ON "_guides_v_blocks_guide_bookmark" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_download_items_order_idx" ON "_guides_v_blocks_guide_download_items" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_download_items_parent_id_idx" ON "_guides_v_blocks_guide_download_items" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_download_items_file_idx" ON "_guides_v_blocks_guide_download_items" USING btree ("file_id");
  CREATE INDEX "_guides_v_blocks_guide_download_order_idx" ON "_guides_v_blocks_guide_download" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_download_parent_id_idx" ON "_guides_v_blocks_guide_download" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_download_path_idx" ON "_guides_v_blocks_guide_download" USING btree ("_path");
  CREATE INDEX "_guides_v_blocks_guide_divider_order_idx" ON "_guides_v_blocks_guide_divider" USING btree ("_order");
  CREATE INDEX "_guides_v_blocks_guide_divider_parent_id_idx" ON "_guides_v_blocks_guide_divider" USING btree ("_parent_id");
  CREATE INDEX "_guides_v_blocks_guide_divider_path_idx" ON "_guides_v_blocks_guide_divider" USING btree ("_path");
  CREATE INDEX "_guides_v_parent_idx" ON "_guides_v" USING btree ("parent_id");
  CREATE INDEX "_guides_v_version_version_slug_idx" ON "_guides_v" USING btree ("version_slug");
  CREATE INDEX "_guides_v_version_version_cover_image_idx" ON "_guides_v" USING btree ("version_cover_image_id");
  CREATE INDEX "_guides_v_version_version_category_idx" ON "_guides_v" USING btree ("version_category_id");
  CREATE INDEX "_guides_v_version_version_updated_at_idx" ON "_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_guides_v_version_version_created_at_idx" ON "_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_guides_v_version_version__status_idx" ON "_guides_v" USING btree ("version__status");
  CREATE INDEX "_guides_v_created_at_idx" ON "_guides_v" USING btree ("created_at");
  CREATE INDEX "_guides_v_updated_at_idx" ON "_guides_v" USING btree ("updated_at");
  CREATE INDEX "_guides_v_latest_idx" ON "_guides_v" USING btree ("latest");
  CREATE INDEX "_guides_v_autosave_idx" ON "_guides_v" USING btree ("autosave");
  CREATE INDEX "_guides_v_rels_order_idx" ON "_guides_v_rels" USING btree ("order");
  CREATE INDEX "_guides_v_rels_parent_idx" ON "_guides_v_rels" USING btree ("parent_id");
  CREATE INDEX "_guides_v_rels_path_idx" ON "_guides_v_rels" USING btree ("path");
  CREATE INDEX "_guides_v_rels_guides_id_idx" ON "_guides_v_rels" USING btree ("guides_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_guides_fk" FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_guides_id_idx" ON "payload_locked_documents_rels" USING btree ("guides_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_columns_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_toggle_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_bookmark_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_bookmark" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_download_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_download" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_blocks_guide_divider" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "guides_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_callout" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_image" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_video" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_toggle_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_toggle" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_bookmark_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_bookmark" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_download_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_download" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_blocks_guide_divider" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_guides_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "guides_blocks_guide_rich_text" CASCADE;
  DROP TABLE "guides_blocks_guide_callout" CASCADE;
  DROP TABLE "guides_blocks_guide_columns_columns" CASCADE;
  DROP TABLE "guides_blocks_guide_columns" CASCADE;
  DROP TABLE "guides_blocks_guide_gallery_images" CASCADE;
  DROP TABLE "guides_blocks_guide_gallery" CASCADE;
  DROP TABLE "guides_blocks_guide_image" CASCADE;
  DROP TABLE "guides_blocks_guide_video" CASCADE;
  DROP TABLE "guides_blocks_guide_toggle_items" CASCADE;
  DROP TABLE "guides_blocks_guide_toggle" CASCADE;
  DROP TABLE "guides_blocks_guide_bookmark_items" CASCADE;
  DROP TABLE "guides_blocks_guide_bookmark" CASCADE;
  DROP TABLE "guides_blocks_guide_download_items" CASCADE;
  DROP TABLE "guides_blocks_guide_download" CASCADE;
  DROP TABLE "guides_blocks_guide_divider" CASCADE;
  DROP TABLE "guides" CASCADE;
  DROP TABLE "guides_rels" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_rich_text" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_callout" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_columns_columns" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_columns" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_gallery_images" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_gallery" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_image" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_video" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_toggle_items" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_toggle" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_bookmark_items" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_bookmark" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_download_items" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_download" CASCADE;
  DROP TABLE "_guides_v_blocks_guide_divider" CASCADE;
  DROP TABLE "_guides_v" CASCADE;
  DROP TABLE "_guides_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_guides_fk";
  
  DROP INDEX "payload_locked_documents_rels_guides_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "guides_id";
  DROP TYPE "public"."enum_guides_blocks_guide_callout_tone";
  DROP TYPE "public"."enum_guides_blocks_guide_columns_columns_type";
  DROP TYPE "public"."enum_guides_blocks_guide_columns_align";
  DROP TYPE "public"."enum_guides_blocks_guide_gallery_layout";
  DROP TYPE "public"."enum_guides_blocks_guide_image_width";
  DROP TYPE "public"."enum_guides_blocks_guide_download_items_kind";
  DROP TYPE "public"."enum_guides_section";
  DROP TYPE "public"."enum_guides_status";
  DROP TYPE "public"."enum__guides_v_blocks_guide_callout_tone";
  DROP TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type";
  DROP TYPE "public"."enum__guides_v_blocks_guide_columns_align";
  DROP TYPE "public"."enum__guides_v_blocks_guide_gallery_layout";
  DROP TYPE "public"."enum__guides_v_blocks_guide_image_width";
  DROP TYPE "public"."enum__guides_v_blocks_guide_download_items_kind";
  DROP TYPE "public"."enum__guides_v_version_section";
  DROP TYPE "public"."enum__guides_v_version_status";`)
}
