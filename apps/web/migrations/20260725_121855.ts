import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_blocks_story_video_videos_source" AS ENUM('embed', 'upload');
  CREATE TABLE "products_blocks_story_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"text" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "products_blocks_story_back_cover" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"text" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "products_blocks_story_quotes_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"name" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "products_blocks_story_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Fra leserne',
  	"block_name" varchar
  );
  
  CREATE TABLE "products_blocks_story_pdf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Ta en titt inni',
  	"intro" varchar,
  	"file_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "products_blocks_story_video_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source" "enum_products_blocks_story_video_videos_source" DEFAULT 'embed',
  	"embed_url" varchar,
  	"video_file_id" integer,
  	"poster_id" integer,
  	"autoplay" boolean DEFAULT false,
  	"muted" boolean DEFAULT false,
  	"loop" boolean DEFAULT false,
  	"show_controls" boolean DEFAULT true
  );
  
  CREATE TABLE "products_blocks_story_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Se og hør',
  	"intro" varchar,
  	"block_name" varchar
  );
  
  -- Datamigrering: flytt eksisterende «historie»-innhold inn i blokkene
  -- (samme rekkefølge som de gamle faste seksjonene) før kildene droppes.
  INSERT INTO "products_blocks_story_text" ("_order", "_parent_id", "_path", "id", "text")
  SELECT 1, "id", 'storySections', 'mig-text-' || "id", "medium_description"
  FROM "products" WHERE COALESCE(TRIM("medium_description"), '') <> '';

  INSERT INTO "products_blocks_story_back_cover" ("_order", "_parent_id", "_path", "id", "image_id", "text", "note")
  SELECT 2, "id", 'storySections', 'mig-bc-' || "id", "back_cover_image_id", "back_cover_text", "back_cover_note"
  FROM "products" WHERE "back_cover_image_id" IS NOT NULL OR COALESCE(TRIM("back_cover_text"), '') <> '';

  INSERT INTO "products_blocks_story_quotes" ("_order", "_parent_id", "_path", "id", "title")
  SELECT 3, p."id", 'storySections', 'mig-q-' || p."id", 'Fra leserne'
  FROM "products" p WHERE EXISTS (SELECT 1 FROM "products_reader_quotes" r WHERE r."_parent_id" = p."id");

  INSERT INTO "products_blocks_story_quotes_quotes" ("_order", "_parent_id", "id", "quote", "name", "detail")
  SELECT r."_order", 'mig-q-' || r."_parent_id", r."id", r."quote", r."name", r."detail"
  FROM "products_reader_quotes" r;

  INSERT INTO "products_blocks_story_pdf" ("_order", "_parent_id", "_path", "id", "title", "intro", "file_id")
  SELECT 4, "id", 'storySections', 'mig-pdf-' || "id", COALESCE("pdf_preview_title", 'Ta en titt inni'), "pdf_preview_description", "pdf_preview_file_id"
  FROM "products" WHERE "pdf_preview_file_id" IS NOT NULL;

  INSERT INTO "products_blocks_story_video" ("_order", "_parent_id", "_path", "id", "title", "intro")
  SELECT 5, p."id", 'storySections', 'mig-vid-' || p."id", COALESCE(p."videos_title", 'Se og hør'), p."videos_intro"
  FROM "products" p WHERE EXISTS (SELECT 1 FROM "products_videos" v WHERE v."_parent_id" = p."id");

  INSERT INTO "products_blocks_story_video_videos" ("_order", "_parent_id", "id", "title", "source", "embed_url", "video_file_id", "poster_id", "autoplay", "muted", "loop", "show_controls")
  SELECT v."_order", 'mig-vid-' || v."_parent_id", v."id", v."title", v."source"::text::"enum_products_blocks_story_video_videos_source", v."embed_url", v."video_file_id", v."poster_id", v."autoplay", v."muted", v."loop", v."show_controls"
  FROM "products_videos" v;

  ALTER TABLE "products_reader_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_reader_quotes" CASCADE;
  DROP TABLE "products_videos" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_back_cover_image_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_pdf_preview_file_id_media_id_fk";
  
  DROP INDEX "products_back_cover_back_cover_image_idx";
  DROP INDEX "products_pdf_preview_pdf_preview_file_idx";
  ALTER TABLE "products_blocks_story_text" ADD CONSTRAINT "products_blocks_story_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_back_cover" ADD CONSTRAINT "products_blocks_story_back_cover_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_blocks_story_back_cover" ADD CONSTRAINT "products_blocks_story_back_cover_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_quotes_quotes" ADD CONSTRAINT "products_blocks_story_quotes_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_blocks_story_quotes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_quotes" ADD CONSTRAINT "products_blocks_story_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_pdf" ADD CONSTRAINT "products_blocks_story_pdf_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_blocks_story_pdf" ADD CONSTRAINT "products_blocks_story_pdf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_video_videos" ADD CONSTRAINT "products_blocks_story_video_videos_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_blocks_story_video_videos" ADD CONSTRAINT "products_blocks_story_video_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_blocks_story_video_videos" ADD CONSTRAINT "products_blocks_story_video_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products_blocks_story_video"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_blocks_story_video" ADD CONSTRAINT "products_blocks_story_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_blocks_story_text_order_idx" ON "products_blocks_story_text" USING btree ("_order");
  CREATE INDEX "products_blocks_story_text_parent_id_idx" ON "products_blocks_story_text" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_text_path_idx" ON "products_blocks_story_text" USING btree ("_path");
  CREATE INDEX "products_blocks_story_back_cover_order_idx" ON "products_blocks_story_back_cover" USING btree ("_order");
  CREATE INDEX "products_blocks_story_back_cover_parent_id_idx" ON "products_blocks_story_back_cover" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_back_cover_path_idx" ON "products_blocks_story_back_cover" USING btree ("_path");
  CREATE INDEX "products_blocks_story_back_cover_image_idx" ON "products_blocks_story_back_cover" USING btree ("image_id");
  CREATE INDEX "products_blocks_story_quotes_quotes_order_idx" ON "products_blocks_story_quotes_quotes" USING btree ("_order");
  CREATE INDEX "products_blocks_story_quotes_quotes_parent_id_idx" ON "products_blocks_story_quotes_quotes" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_quotes_order_idx" ON "products_blocks_story_quotes" USING btree ("_order");
  CREATE INDEX "products_blocks_story_quotes_parent_id_idx" ON "products_blocks_story_quotes" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_quotes_path_idx" ON "products_blocks_story_quotes" USING btree ("_path");
  CREATE INDEX "products_blocks_story_pdf_order_idx" ON "products_blocks_story_pdf" USING btree ("_order");
  CREATE INDEX "products_blocks_story_pdf_parent_id_idx" ON "products_blocks_story_pdf" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_pdf_path_idx" ON "products_blocks_story_pdf" USING btree ("_path");
  CREATE INDEX "products_blocks_story_pdf_file_idx" ON "products_blocks_story_pdf" USING btree ("file_id");
  CREATE INDEX "products_blocks_story_video_videos_order_idx" ON "products_blocks_story_video_videos" USING btree ("_order");
  CREATE INDEX "products_blocks_story_video_videos_parent_id_idx" ON "products_blocks_story_video_videos" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_video_videos_video_file_idx" ON "products_blocks_story_video_videos" USING btree ("video_file_id");
  CREATE INDEX "products_blocks_story_video_videos_poster_idx" ON "products_blocks_story_video_videos" USING btree ("poster_id");
  CREATE INDEX "products_blocks_story_video_order_idx" ON "products_blocks_story_video" USING btree ("_order");
  CREATE INDEX "products_blocks_story_video_parent_id_idx" ON "products_blocks_story_video" USING btree ("_parent_id");
  CREATE INDEX "products_blocks_story_video_path_idx" ON "products_blocks_story_video" USING btree ("_path");
  ALTER TABLE "products" DROP COLUMN "medium_description";
  ALTER TABLE "products" DROP COLUMN "back_cover_image_id";
  ALTER TABLE "products" DROP COLUMN "back_cover_text";
  ALTER TABLE "products" DROP COLUMN "back_cover_note";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_file_id";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_title";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_description";
  ALTER TABLE "products" DROP COLUMN "videos_title";
  ALTER TABLE "products" DROP COLUMN "videos_intro";
  DROP TYPE "public"."enum_products_videos_source";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_videos_source" AS ENUM('embed', 'upload');
  CREATE TABLE "products_reader_quotes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"name" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "products_videos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"source" "enum_products_videos_source" DEFAULT 'embed',
  	"embed_url" varchar,
  	"video_file_id" integer,
  	"poster_id" integer,
  	"autoplay" boolean DEFAULT false,
  	"muted" boolean DEFAULT false,
  	"loop" boolean DEFAULT false,
  	"show_controls" boolean DEFAULT true
  );
  
  ALTER TABLE "products_blocks_story_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_back_cover" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_quotes_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_pdf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_video_videos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_blocks_story_video" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_blocks_story_text" CASCADE;
  DROP TABLE "products_blocks_story_back_cover" CASCADE;
  DROP TABLE "products_blocks_story_quotes_quotes" CASCADE;
  DROP TABLE "products_blocks_story_quotes" CASCADE;
  DROP TABLE "products_blocks_story_pdf" CASCADE;
  DROP TABLE "products_blocks_story_video_videos" CASCADE;
  DROP TABLE "products_blocks_story_video" CASCADE;
  ALTER TABLE "products" ADD COLUMN "medium_description" varchar;
  ALTER TABLE "products" ADD COLUMN "back_cover_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "back_cover_text" varchar;
  ALTER TABLE "products" ADD COLUMN "back_cover_note" varchar;
  ALTER TABLE "products" ADD COLUMN "pdf_preview_file_id" integer;
  ALTER TABLE "products" ADD COLUMN "pdf_preview_title" varchar DEFAULT 'Ta en titt inni';
  ALTER TABLE "products" ADD COLUMN "pdf_preview_description" varchar;
  ALTER TABLE "products" ADD COLUMN "videos_title" varchar DEFAULT 'Se og hør';
  ALTER TABLE "products" ADD COLUMN "videos_intro" varchar;
  ALTER TABLE "products_reader_quotes" ADD CONSTRAINT "products_reader_quotes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_videos" ADD CONSTRAINT "products_videos_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_videos" ADD CONSTRAINT "products_videos_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_videos" ADD CONSTRAINT "products_videos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_reader_quotes_order_idx" ON "products_reader_quotes" USING btree ("_order");
  CREATE INDEX "products_reader_quotes_parent_id_idx" ON "products_reader_quotes" USING btree ("_parent_id");
  CREATE INDEX "products_videos_order_idx" ON "products_videos" USING btree ("_order");
  CREATE INDEX "products_videos_parent_id_idx" ON "products_videos" USING btree ("_parent_id");
  CREATE INDEX "products_videos_video_file_idx" ON "products_videos" USING btree ("video_file_id");
  CREATE INDEX "products_videos_poster_idx" ON "products_videos" USING btree ("poster_id");
  ALTER TABLE "products" ADD CONSTRAINT "products_back_cover_image_id_media_id_fk" FOREIGN KEY ("back_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_pdf_preview_file_id_media_id_fk" FOREIGN KEY ("pdf_preview_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_back_cover_back_cover_image_idx" ON "products" USING btree ("back_cover_image_id");
  CREATE INDEX "products_pdf_preview_pdf_preview_file_idx" ON "products" USING btree ("pdf_preview_file_id");
  DROP TYPE "public"."enum_products_blocks_story_video_videos_source";`)
}
