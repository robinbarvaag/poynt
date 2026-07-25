import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
  
  ALTER TABLE "products" ADD COLUMN "medium_description" varchar;
  ALTER TABLE "products" ADD COLUMN "back_cover_image_id" integer;
  ALTER TABLE "products" ADD COLUMN "back_cover_text" varchar;
  ALTER TABLE "products" ADD COLUMN "back_cover_note" varchar;
  ALTER TABLE "products" ADD COLUMN "pdf_preview_file_id" integer;
  ALTER TABLE "products" ADD COLUMN "pdf_preview_title" varchar DEFAULT 'Ta ein titt inni';
  ALTER TABLE "products" ADD COLUMN "pdf_preview_description" varchar;
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
  CREATE INDEX "products_pdf_preview_pdf_preview_file_idx" ON "products" USING btree ("pdf_preview_file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_reader_quotes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_videos" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_reader_quotes" CASCADE;
  DROP TABLE "products_videos" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_back_cover_image_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_pdf_preview_file_id_media_id_fk";
  
  DROP INDEX "products_back_cover_back_cover_image_idx";
  DROP INDEX "products_pdf_preview_pdf_preview_file_idx";
  ALTER TABLE "products" DROP COLUMN "medium_description";
  ALTER TABLE "products" DROP COLUMN "back_cover_image_id";
  ALTER TABLE "products" DROP COLUMN "back_cover_text";
  ALTER TABLE "products" DROP COLUMN "back_cover_note";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_file_id";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_title";
  ALTER TABLE "products" DROP COLUMN "pdf_preview_description";
  DROP TYPE "public"."enum_products_videos_source";`)
}
