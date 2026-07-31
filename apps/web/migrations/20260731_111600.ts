import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_carousel_slides_kind" AS ENUM('image', 'video', 'logo', 'content');
  CREATE TYPE "public"."enum_pages_blocks_carousel_effect" AS ENUM('none', 'parallax', 'scale', 'opacity', 'depth');
  CREATE TYPE "public"."enum_pages_blocks_carousel_slides_per_view" AS ENUM('1', '2', '3', '4', '5');
  CREATE TYPE "public"."enum_pages_blocks_carousel_aspect" AS ENUM('video', 'wide', 'square', 'portrait', 'auto');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_slides_kind" AS ENUM('image', 'video', 'logo', 'content');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_effect" AS ENUM('none', 'parallax', 'scale', 'opacity', 'depth');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_slides_per_view" AS ENUM('1', '2', '3', '4', '5');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_aspect" AS ENUM('video', 'wide', 'square', 'portrait', 'auto');
  CREATE TYPE "public"."enum_homepage_blocks_carousel_slides_kind" AS ENUM('image', 'video', 'logo', 'content');
  CREATE TYPE "public"."enum_homepage_blocks_carousel_effect" AS ENUM('none', 'parallax', 'scale', 'opacity', 'depth');
  CREATE TYPE "public"."enum_homepage_blocks_carousel_slides_per_view" AS ENUM('1', '2', '3', '4', '5');
  CREATE TYPE "public"."enum_homepage_blocks_carousel_aspect" AS ENUM('video', 'wide', 'square', 'portrait', 'auto');
  CREATE TABLE "pages_blocks_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_carousel_slides_kind" DEFAULT 'image',
  	"image_id" integer,
  	"video_file_id" integer,
  	"poster_id" integer,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"effect" "enum_pages_blocks_carousel_effect" DEFAULT 'none',
  	"slides_per_view" "enum_pages_blocks_carousel_slides_per_view" DEFAULT '3',
  	"aspect" "enum_pages_blocks_carousel_aspect" DEFAULT 'video',
  	"auto_scroll" boolean DEFAULT false,
  	"autoplay_seconds" numeric DEFAULT 0,
  	"loop" boolean DEFAULT true,
  	"show_arrows" boolean DEFAULT true,
  	"show_dots" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_carousel_slides_kind" DEFAULT 'image',
  	"image_id" integer,
  	"video_file_id" integer,
  	"poster_id" integer,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"effect" "enum__pages_v_blocks_carousel_effect" DEFAULT 'none',
  	"slides_per_view" "enum__pages_v_blocks_carousel_slides_per_view" DEFAULT '3',
  	"aspect" "enum__pages_v_blocks_carousel_aspect" DEFAULT 'video',
  	"auto_scroll" boolean DEFAULT false,
  	"autoplay_seconds" numeric DEFAULT 0,
  	"loop" boolean DEFAULT true,
  	"show_arrows" boolean DEFAULT true,
  	"show_dots" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel_slides" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_homepage_blocks_carousel_slides_kind" DEFAULT 'image' NOT NULL,
  	"image_id" integer,
  	"video_file_id" integer,
  	"poster_id" integer,
  	"eyebrow" varchar,
  	"title" varchar,
  	"text" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "homepage_blocks_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"intro" varchar,
  	"effect" "enum_homepage_blocks_carousel_effect" DEFAULT 'none',
  	"slides_per_view" "enum_homepage_blocks_carousel_slides_per_view" DEFAULT '3',
  	"aspect" "enum_homepage_blocks_carousel_aspect" DEFAULT 'video',
  	"auto_scroll" boolean DEFAULT false,
  	"autoplay_seconds" numeric DEFAULT 0,
  	"loop" boolean DEFAULT true,
  	"show_arrows" boolean DEFAULT true,
  	"show_dots" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_carousel_slides" ADD CONSTRAINT "pages_blocks_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_slides" ADD CONSTRAINT "pages_blocks_carousel_slides_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_slides" ADD CONSTRAINT "pages_blocks_carousel_slides_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_slides" ADD CONSTRAINT "pages_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel" ADD CONSTRAINT "pages_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_carousel_slides_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_carousel_slides_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_slides" ADD CONSTRAINT "_pages_v_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel" ADD CONSTRAINT "_pages_v_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel_slides" ADD CONSTRAINT "homepage_blocks_carousel_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel_slides" ADD CONSTRAINT "homepage_blocks_carousel_slides_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel_slides" ADD CONSTRAINT "homepage_blocks_carousel_slides_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel_slides" ADD CONSTRAINT "homepage_blocks_carousel_slides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_carousel"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_carousel" ADD CONSTRAINT "homepage_blocks_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_carousel_slides_order_idx" ON "pages_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_slides_parent_id_idx" ON "pages_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_slides_image_idx" ON "pages_blocks_carousel_slides" USING btree ("image_id");
  CREATE INDEX "pages_blocks_carousel_slides_video_file_idx" ON "pages_blocks_carousel_slides" USING btree ("video_file_id");
  CREATE INDEX "pages_blocks_carousel_slides_poster_idx" ON "pages_blocks_carousel_slides" USING btree ("poster_id");
  CREATE INDEX "pages_blocks_carousel_order_idx" ON "pages_blocks_carousel" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_parent_id_idx" ON "pages_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_path_idx" ON "pages_blocks_carousel" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel_slides_order_idx" ON "_pages_v_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_slides_parent_id_idx" ON "_pages_v_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_slides_image_idx" ON "_pages_v_blocks_carousel_slides" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_carousel_slides_video_file_idx" ON "_pages_v_blocks_carousel_slides" USING btree ("video_file_id");
  CREATE INDEX "_pages_v_blocks_carousel_slides_poster_idx" ON "_pages_v_blocks_carousel_slides" USING btree ("poster_id");
  CREATE INDEX "_pages_v_blocks_carousel_order_idx" ON "_pages_v_blocks_carousel" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_parent_id_idx" ON "_pages_v_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_path_idx" ON "_pages_v_blocks_carousel" USING btree ("_path");
  CREATE INDEX "homepage_blocks_carousel_slides_order_idx" ON "homepage_blocks_carousel_slides" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel_slides_parent_id_idx" ON "homepage_blocks_carousel_slides" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel_slides_image_idx" ON "homepage_blocks_carousel_slides" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_carousel_slides_video_file_idx" ON "homepage_blocks_carousel_slides" USING btree ("video_file_id");
  CREATE INDEX "homepage_blocks_carousel_slides_poster_idx" ON "homepage_blocks_carousel_slides" USING btree ("poster_id");
  CREATE INDEX "homepage_blocks_carousel_order_idx" ON "homepage_blocks_carousel" USING btree ("_order");
  CREATE INDEX "homepage_blocks_carousel_parent_id_idx" ON "homepage_blocks_carousel" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_carousel_path_idx" ON "homepage_blocks_carousel" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_carousel_slides" CASCADE;
  DROP TABLE "pages_blocks_carousel" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel_slides" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel" CASCADE;
  DROP TABLE "homepage_blocks_carousel_slides" CASCADE;
  DROP TABLE "homepage_blocks_carousel" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_carousel_slides_kind";
  DROP TYPE "public"."enum_pages_blocks_carousel_effect";
  DROP TYPE "public"."enum_pages_blocks_carousel_slides_per_view";
  DROP TYPE "public"."enum_pages_blocks_carousel_aspect";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_slides_kind";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_effect";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_slides_per_view";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_aspect";
  DROP TYPE "public"."enum_homepage_blocks_carousel_slides_kind";
  DROP TYPE "public"."enum_homepage_blocks_carousel_effect";
  DROP TYPE "public"."enum_homepage_blocks_carousel_slides_per_view";
  DROP TYPE "public"."enum_homepage_blocks_carousel_aspect";`)
}
