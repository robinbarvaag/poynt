import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_book_hero_figure_side" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_book_hero_figure_aspect" AS ENUM('book', 'card', 'square');
  CREATE TYPE "public"."enum_pages_blocks_book_hero_palette" AS ENUM('book', 'poynt', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_book_hero_rotator_markers" AS ENUM('initials', 'numbers', 'dots');
  CREATE TYPE "public"."enum_pages_blocks_book_hero_shapes" AS ENUM('subtle', 'default', 'none');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_items_kind" AS ENUM('link', 'file', 'book', 'podcast', 'music', 'video', 'tool', 'app');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_pages_blocks_resource_list_show_filter" AS ENUM('auto', 'always', 'never');
  CREATE TYPE "public"."enum_pages_blocks_prompt_library_prompts_tool" AS ENUM('ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Alle KI-verktøy');
  CREATE TYPE "public"."enum_pages_blocks_prompt_library_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum__pages_v_blocks_book_hero_figure_side" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_book_hero_figure_aspect" AS ENUM('book', 'card', 'square');
  CREATE TYPE "public"."enum__pages_v_blocks_book_hero_palette" AS ENUM('book', 'poynt', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_book_hero_rotator_markers" AS ENUM('initials', 'numbers', 'dots');
  CREATE TYPE "public"."enum__pages_v_blocks_book_hero_shapes" AS ENUM('subtle', 'default', 'none');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_items_kind" AS ENUM('link', 'file', 'book', 'podcast', 'music', 'video', 'tool', 'app');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum__pages_v_blocks_resource_list_show_filter" AS ENUM('auto', 'always', 'never');
  CREATE TYPE "public"."enum__pages_v_blocks_prompt_library_prompts_tool" AS ENUM('ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Alle KI-verktøy');
  CREATE TYPE "public"."enum__pages_v_blocks_prompt_library_columns" AS ENUM('1', '2', '3');
  CREATE TYPE "public"."enum_homepage_blocks_book_hero_figure_side" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_homepage_blocks_book_hero_figure_aspect" AS ENUM('book', 'card', 'square');
  CREATE TYPE "public"."enum_homepage_blocks_book_hero_palette" AS ENUM('book', 'poynt', 'custom');
  CREATE TYPE "public"."enum_homepage_blocks_book_hero_rotator_markers" AS ENUM('initials', 'numbers', 'dots');
  CREATE TYPE "public"."enum_homepage_blocks_book_hero_shapes" AS ENUM('subtle', 'default', 'none');
  CREATE TYPE "public"."enum_homepage_blocks_resource_list_items_kind" AS ENUM('link', 'file', 'book', 'podcast', 'music', 'video', 'tool', 'app');
  CREATE TYPE "public"."enum_homepage_blocks_resource_list_layout" AS ENUM('grid', 'list');
  CREATE TYPE "public"."enum_homepage_blocks_resource_list_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "public"."enum_homepage_blocks_resource_list_show_filter" AS ENUM('auto', 'always', 'never');
  CREATE TYPE "public"."enum_homepage_blocks_prompt_library_prompts_tool" AS ENUM('ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Alle KI-verktøy');
  CREATE TYPE "public"."enum_homepage_blocks_prompt_library_columns" AS ENUM('1', '2', '3');
  CREATE TABLE "pages_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"kind" "enum_pages_blocks_resource_list_items_kind" DEFAULT 'link',
  	"description" varchar,
  	"url" varchar,
  	"file_id" integer,
  	"image_id" integer,
  	"category" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "pages_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"layout" "enum_pages_blocks_resource_list_layout" DEFAULT 'grid',
  	"columns" "enum_pages_blocks_resource_list_columns" DEFAULT '3',
  	"show_filter" "enum_pages_blocks_resource_list_show_filter" DEFAULT 'auto',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_prompt_library_prompts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tool" "enum_pages_blocks_prompt_library_prompts_tool",
  	"description" varchar,
  	"prompt" varchar,
  	"tags" varchar
  );
  
  CREATE TABLE "pages_blocks_prompt_library" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"columns" "enum_pages_blocks_prompt_library_columns" DEFAULT '2',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"kind" "enum__pages_v_blocks_resource_list_items_kind" DEFAULT 'link',
  	"description" varchar,
  	"url" varchar,
  	"file_id" integer,
  	"image_id" integer,
  	"category" varchar,
  	"note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"layout" "enum__pages_v_blocks_resource_list_layout" DEFAULT 'grid',
  	"columns" "enum__pages_v_blocks_resource_list_columns" DEFAULT '3',
  	"show_filter" "enum__pages_v_blocks_resource_list_show_filter" DEFAULT 'auto',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_prompt_library_prompts" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"tool" "enum__pages_v_blocks_prompt_library_prompts_tool",
  	"description" varchar,
  	"prompt" varchar,
  	"tags" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_prompt_library" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"columns" "enum__pages_v_blocks_prompt_library_columns" DEFAULT '2',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_resource_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"kind" "enum_homepage_blocks_resource_list_items_kind" DEFAULT 'link' NOT NULL,
  	"description" varchar,
  	"url" varchar,
  	"file_id" integer,
  	"image_id" integer,
  	"category" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "homepage_blocks_resource_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"layout" "enum_homepage_blocks_resource_list_layout" DEFAULT 'grid',
  	"columns" "enum_homepage_blocks_resource_list_columns" DEFAULT '3',
  	"show_filter" "enum_homepage_blocks_resource_list_show_filter" DEFAULT 'auto',
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_prompt_library_prompts" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"tool" "enum_homepage_blocks_prompt_library_prompts_tool",
  	"description" varchar,
  	"prompt" varchar NOT NULL,
  	"tags" varchar
  );
  
  CREATE TABLE "homepage_blocks_prompt_library" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"columns" "enum_homepage_blocks_prompt_library_columns" DEFAULT '2',
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_book_hero_chapters" ADD COLUMN "href" varchar;
  ALTER TABLE "pages_blocks_book_hero_chapters" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "primary_cta_text" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "primary_cta_url" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "secondary_cta_text" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "secondary_cta_url" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "figure_side" "enum_pages_blocks_book_hero_figure_side" DEFAULT 'right';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "figure_aspect" "enum_pages_blocks_book_hero_figure_aspect" DEFAULT 'book';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "palette" "enum_pages_blocks_book_hero_palette" DEFAULT 'book';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "custom_palette_surface" varchar DEFAULT '#cdc1da';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "custom_palette_ink" varchar DEFAULT '#33174a';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "custom_palette_accent" varchar DEFAULT '#cbcd8e';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "rotator_eyebrow" varchar;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "rotator_markers" "enum_pages_blocks_book_hero_rotator_markers" DEFAULT 'initials';
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "rotator_interval" numeric DEFAULT 4;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "shapes" "enum_pages_blocks_book_hero_shapes" DEFAULT 'subtle';
  ALTER TABLE "_pages_v_blocks_book_hero_chapters" ADD COLUMN "href" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero_chapters" ADD COLUMN "link_label" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "primary_cta_text" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "primary_cta_url" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "secondary_cta_text" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "secondary_cta_url" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "figure_side" "enum__pages_v_blocks_book_hero_figure_side" DEFAULT 'right';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "figure_aspect" "enum__pages_v_blocks_book_hero_figure_aspect" DEFAULT 'book';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "palette" "enum__pages_v_blocks_book_hero_palette" DEFAULT 'book';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "custom_palette_surface" varchar DEFAULT '#cdc1da';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "custom_palette_ink" varchar DEFAULT '#33174a';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "custom_palette_accent" varchar DEFAULT '#cbcd8e';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "rotator_eyebrow" varchar;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "rotator_markers" "enum__pages_v_blocks_book_hero_rotator_markers" DEFAULT 'initials';
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "rotator_interval" numeric DEFAULT 4;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "shapes" "enum__pages_v_blocks_book_hero_shapes" DEFAULT 'subtle';
  ALTER TABLE "orders" ADD COLUMN "terms_accepted_at" timestamp(3) with time zone;
  ALTER TABLE "orders" ADD COLUMN "terms_accepted_text" varchar;
  ALTER TABLE "homepage_blocks_book_hero_chapters" ADD COLUMN "href" varchar;
  ALTER TABLE "homepage_blocks_book_hero_chapters" ADD COLUMN "link_label" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "primary_cta_text" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "primary_cta_url" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "secondary_cta_text" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "secondary_cta_url" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "figure_side" "enum_homepage_blocks_book_hero_figure_side" DEFAULT 'right';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "figure_aspect" "enum_homepage_blocks_book_hero_figure_aspect" DEFAULT 'book';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "palette" "enum_homepage_blocks_book_hero_palette" DEFAULT 'book';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "custom_palette_surface" varchar DEFAULT '#cdc1da';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "custom_palette_ink" varchar DEFAULT '#33174a';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "custom_palette_accent" varchar DEFAULT '#cbcd8e';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "rotator_eyebrow" varchar;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "rotator_markers" "enum_homepage_blocks_book_hero_rotator_markers" DEFAULT 'initials';
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "rotator_interval" numeric DEFAULT 4;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "shapes" "enum_homepage_blocks_book_hero_shapes" DEFAULT 'subtle';
  ALTER TABLE "shop_settings" ADD COLUMN "consent_checkbox_label" varchar DEFAULT 'Jeg ber om at det digitale innholdet leveres umiddelbart, og forstår at angreretten dermed bortfaller. Jeg godtar kjøpsbetingelsene.' NOT NULL;
  ALTER TABLE "shop_settings" ADD COLUMN "consent_dialog_title" varchar DEFAULT 'Før du betaler' NOT NULL;
  ALTER TABLE "shop_settings" ADD COLUMN "consent_error_message" varchar DEFAULT 'Du må godta vilkårene før du kan gå videre til betaling.' NOT NULL;
  ALTER TABLE "shop_settings" ADD COLUMN "consent_dialog_text" varchar DEFAULT 'Digitalt innhold leveres med en gang betalingen er gjennomført. For at vi skal kunne levere umiddelbart, må du bekrefte at du ber om det og godtar at angreretten bortfaller (angrerettloven § 22 bokstav n).' NOT NULL;
  ALTER TABLE "pages_blocks_resource_list_items" ADD CONSTRAINT "pages_blocks_resource_list_items_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list_items" ADD CONSTRAINT "pages_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list_items" ADD CONSTRAINT "pages_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_resource_list" ADD CONSTRAINT "pages_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_prompt_library_prompts" ADD CONSTRAINT "pages_blocks_prompt_library_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_prompt_library"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_prompt_library" ADD CONSTRAINT "pages_blocks_prompt_library_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list_items" ADD CONSTRAINT "_pages_v_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_resource_list" ADD CONSTRAINT "_pages_v_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_prompt_library_prompts" ADD CONSTRAINT "_pages_v_blocks_prompt_library_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_prompt_library"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_prompt_library" ADD CONSTRAINT "_pages_v_blocks_prompt_library_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_resource_list_items" ADD CONSTRAINT "homepage_blocks_resource_list_items_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_resource_list_items" ADD CONSTRAINT "homepage_blocks_resource_list_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_resource_list_items" ADD CONSTRAINT "homepage_blocks_resource_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_resource_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_resource_list" ADD CONSTRAINT "homepage_blocks_resource_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_prompt_library_prompts" ADD CONSTRAINT "homepage_blocks_prompt_library_prompts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_prompt_library"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_prompt_library" ADD CONSTRAINT "homepage_blocks_prompt_library_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_resource_list_items_order_idx" ON "pages_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_list_items_parent_id_idx" ON "pages_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_list_items_file_idx" ON "pages_blocks_resource_list_items" USING btree ("file_id");
  CREATE INDEX "pages_blocks_resource_list_items_image_idx" ON "pages_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "pages_blocks_resource_list_order_idx" ON "pages_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_resource_list_parent_id_idx" ON "pages_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_resource_list_path_idx" ON "pages_blocks_resource_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_prompt_library_prompts_order_idx" ON "pages_blocks_prompt_library_prompts" USING btree ("_order");
  CREATE INDEX "pages_blocks_prompt_library_prompts_parent_id_idx" ON "pages_blocks_prompt_library_prompts" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_prompt_library_order_idx" ON "pages_blocks_prompt_library" USING btree ("_order");
  CREATE INDEX "pages_blocks_prompt_library_parent_id_idx" ON "pages_blocks_prompt_library" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_prompt_library_path_idx" ON "pages_blocks_prompt_library" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_resource_list_items_order_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_list_items_parent_id_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_items_file_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("file_id");
  CREATE INDEX "_pages_v_blocks_resource_list_items_image_idx" ON "_pages_v_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_resource_list_order_idx" ON "_pages_v_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_resource_list_parent_id_idx" ON "_pages_v_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_resource_list_path_idx" ON "_pages_v_blocks_resource_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_prompt_library_prompts_order_idx" ON "_pages_v_blocks_prompt_library_prompts" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_prompt_library_prompts_parent_id_idx" ON "_pages_v_blocks_prompt_library_prompts" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_prompt_library_order_idx" ON "_pages_v_blocks_prompt_library" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_prompt_library_parent_id_idx" ON "_pages_v_blocks_prompt_library" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_prompt_library_path_idx" ON "_pages_v_blocks_prompt_library" USING btree ("_path");
  CREATE INDEX "homepage_blocks_resource_list_items_order_idx" ON "homepage_blocks_resource_list_items" USING btree ("_order");
  CREATE INDEX "homepage_blocks_resource_list_items_parent_id_idx" ON "homepage_blocks_resource_list_items" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_resource_list_items_file_idx" ON "homepage_blocks_resource_list_items" USING btree ("file_id");
  CREATE INDEX "homepage_blocks_resource_list_items_image_idx" ON "homepage_blocks_resource_list_items" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_resource_list_order_idx" ON "homepage_blocks_resource_list" USING btree ("_order");
  CREATE INDEX "homepage_blocks_resource_list_parent_id_idx" ON "homepage_blocks_resource_list" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_resource_list_path_idx" ON "homepage_blocks_resource_list" USING btree ("_path");
  CREATE INDEX "homepage_blocks_prompt_library_prompts_order_idx" ON "homepage_blocks_prompt_library_prompts" USING btree ("_order");
  CREATE INDEX "homepage_blocks_prompt_library_prompts_parent_id_idx" ON "homepage_blocks_prompt_library_prompts" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_prompt_library_order_idx" ON "homepage_blocks_prompt_library" USING btree ("_order");
  CREATE INDEX "homepage_blocks_prompt_library_parent_id_idx" ON "homepage_blocks_prompt_library" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_prompt_library_path_idx" ON "homepage_blocks_prompt_library" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_resource_list_items" CASCADE;
  DROP TABLE "pages_blocks_resource_list" CASCADE;
  DROP TABLE "pages_blocks_prompt_library_prompts" CASCADE;
  DROP TABLE "pages_blocks_prompt_library" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list_items" CASCADE;
  DROP TABLE "_pages_v_blocks_resource_list" CASCADE;
  DROP TABLE "_pages_v_blocks_prompt_library_prompts" CASCADE;
  DROP TABLE "_pages_v_blocks_prompt_library" CASCADE;
  DROP TABLE "homepage_blocks_resource_list_items" CASCADE;
  DROP TABLE "homepage_blocks_resource_list" CASCADE;
  DROP TABLE "homepage_blocks_prompt_library_prompts" CASCADE;
  DROP TABLE "homepage_blocks_prompt_library" CASCADE;
  ALTER TABLE "pages_blocks_book_hero_chapters" DROP COLUMN "href";
  ALTER TABLE "pages_blocks_book_hero_chapters" DROP COLUMN "link_label";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "primary_cta_text";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "primary_cta_url";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "secondary_cta_text";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "secondary_cta_url";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "figure_side";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "figure_aspect";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "palette";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "custom_palette_surface";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "custom_palette_ink";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "custom_palette_accent";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "rotator_eyebrow";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "rotator_markers";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "rotator_interval";
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "shapes";
  ALTER TABLE "_pages_v_blocks_book_hero_chapters" DROP COLUMN "href";
  ALTER TABLE "_pages_v_blocks_book_hero_chapters" DROP COLUMN "link_label";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "primary_cta_text";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "primary_cta_url";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "secondary_cta_text";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "secondary_cta_url";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "figure_side";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "figure_aspect";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "palette";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "custom_palette_surface";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "custom_palette_ink";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "custom_palette_accent";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "rotator_eyebrow";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "rotator_markers";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "rotator_interval";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "shapes";
  ALTER TABLE "orders" DROP COLUMN "terms_accepted_at";
  ALTER TABLE "orders" DROP COLUMN "terms_accepted_text";
  ALTER TABLE "homepage_blocks_book_hero_chapters" DROP COLUMN "href";
  ALTER TABLE "homepage_blocks_book_hero_chapters" DROP COLUMN "link_label";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "primary_cta_text";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "primary_cta_url";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "secondary_cta_text";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "secondary_cta_url";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "figure_side";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "figure_aspect";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "palette";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "custom_palette_surface";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "custom_palette_ink";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "custom_palette_accent";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "rotator_eyebrow";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "rotator_markers";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "rotator_interval";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "shapes";
  ALTER TABLE "shop_settings" DROP COLUMN "consent_checkbox_label";
  ALTER TABLE "shop_settings" DROP COLUMN "consent_dialog_title";
  ALTER TABLE "shop_settings" DROP COLUMN "consent_error_message";
  ALTER TABLE "shop_settings" DROP COLUMN "consent_dialog_text";
  DROP TYPE "public"."enum_pages_blocks_book_hero_figure_side";
  DROP TYPE "public"."enum_pages_blocks_book_hero_figure_aspect";
  DROP TYPE "public"."enum_pages_blocks_book_hero_palette";
  DROP TYPE "public"."enum_pages_blocks_book_hero_rotator_markers";
  DROP TYPE "public"."enum_pages_blocks_book_hero_shapes";
  DROP TYPE "public"."enum_pages_blocks_resource_list_items_kind";
  DROP TYPE "public"."enum_pages_blocks_resource_list_layout";
  DROP TYPE "public"."enum_pages_blocks_resource_list_columns";
  DROP TYPE "public"."enum_pages_blocks_resource_list_show_filter";
  DROP TYPE "public"."enum_pages_blocks_prompt_library_prompts_tool";
  DROP TYPE "public"."enum_pages_blocks_prompt_library_columns";
  DROP TYPE "public"."enum__pages_v_blocks_book_hero_figure_side";
  DROP TYPE "public"."enum__pages_v_blocks_book_hero_figure_aspect";
  DROP TYPE "public"."enum__pages_v_blocks_book_hero_palette";
  DROP TYPE "public"."enum__pages_v_blocks_book_hero_rotator_markers";
  DROP TYPE "public"."enum__pages_v_blocks_book_hero_shapes";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_items_kind";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_layout";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_columns";
  DROP TYPE "public"."enum__pages_v_blocks_resource_list_show_filter";
  DROP TYPE "public"."enum__pages_v_blocks_prompt_library_prompts_tool";
  DROP TYPE "public"."enum__pages_v_blocks_prompt_library_columns";
  DROP TYPE "public"."enum_homepage_blocks_book_hero_figure_side";
  DROP TYPE "public"."enum_homepage_blocks_book_hero_figure_aspect";
  DROP TYPE "public"."enum_homepage_blocks_book_hero_palette";
  DROP TYPE "public"."enum_homepage_blocks_book_hero_rotator_markers";
  DROP TYPE "public"."enum_homepage_blocks_book_hero_shapes";
  DROP TYPE "public"."enum_homepage_blocks_resource_list_items_kind";
  DROP TYPE "public"."enum_homepage_blocks_resource_list_layout";
  DROP TYPE "public"."enum_homepage_blocks_resource_list_columns";
  DROP TYPE "public"."enum_homepage_blocks_resource_list_show_filter";
  DROP TYPE "public"."enum_homepage_blocks_prompt_library_prompts_tool";
  DROP TYPE "public"."enum_homepage_blocks_prompt_library_columns";`)
}
