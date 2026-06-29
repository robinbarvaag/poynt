import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_blocks_guide_columns_width" AS ENUM('normal', 'wide', 'full');
  CREATE TYPE "public"."enum_guides_blocks_guide_video_source" AS ENUM('embed', 'upload');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_columns_width" AS ENUM('normal', 'wide', 'full');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_video_source" AS ENUM('embed', 'upload');
  ALTER TYPE "public"."enum_guides_blocks_guide_columns_columns_type" ADD VALUE 'video';
  ALTER TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type" ADD VALUE 'video';
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "poster_id" integer;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "muted" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "loop" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD COLUMN "show_controls" boolean DEFAULT true;
  ALTER TABLE "guides_blocks_guide_columns" ADD COLUMN "width" "enum_guides_blocks_guide_columns_width" DEFAULT 'wide';
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "source" "enum_guides_blocks_guide_video_source" DEFAULT 'embed';
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "poster_id" integer;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "muted" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "loop" boolean DEFAULT false;
  ALTER TABLE "guides_blocks_guide_video" ADD COLUMN "show_controls" boolean DEFAULT true;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "poster_id" integer;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "muted" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "loop" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD COLUMN "show_controls" boolean DEFAULT true;
  ALTER TABLE "_guides_v_blocks_guide_columns" ADD COLUMN "width" "enum__guides_v_blocks_guide_columns_width" DEFAULT 'wide';
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "source" "enum__guides_v_blocks_guide_video_source" DEFAULT 'embed';
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "video_file_id" integer;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "poster_id" integer;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "autoplay" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "muted" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "loop" boolean DEFAULT false;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD COLUMN "show_controls" boolean DEFAULT true;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD CONSTRAINT "guides_blocks_guide_columns_columns_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_columns_columns" ADD CONSTRAINT "guides_blocks_guide_columns_columns_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_video" ADD CONSTRAINT "guides_blocks_guide_video_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "guides_blocks_guide_video" ADD CONSTRAINT "guides_blocks_guide_video_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" ADD CONSTRAINT "_guides_v_blocks_guide_columns_columns_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD CONSTRAINT "_guides_v_blocks_guide_video_video_file_id_media_id_fk" FOREIGN KEY ("video_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_guides_v_blocks_guide_video" ADD CONSTRAINT "_guides_v_blocks_guide_video_poster_id_media_id_fk" FOREIGN KEY ("poster_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "guides_blocks_guide_columns_columns_video_file_idx" ON "guides_blocks_guide_columns_columns" USING btree ("video_file_id");
  CREATE INDEX "guides_blocks_guide_columns_columns_poster_idx" ON "guides_blocks_guide_columns_columns" USING btree ("poster_id");
  CREATE INDEX "guides_blocks_guide_video_video_file_idx" ON "guides_blocks_guide_video" USING btree ("video_file_id");
  CREATE INDEX "guides_blocks_guide_video_poster_idx" ON "guides_blocks_guide_video" USING btree ("poster_id");
  CREATE INDEX "_guides_v_blocks_guide_columns_columns_video_file_idx" ON "_guides_v_blocks_guide_columns_columns" USING btree ("video_file_id");
  CREATE INDEX "_guides_v_blocks_guide_columns_columns_poster_idx" ON "_guides_v_blocks_guide_columns_columns" USING btree ("poster_id");
  CREATE INDEX "_guides_v_blocks_guide_video_video_file_idx" ON "_guides_v_blocks_guide_video" USING btree ("video_file_id");
  CREATE INDEX "_guides_v_blocks_guide_video_poster_idx" ON "_guides_v_blocks_guide_video" USING btree ("poster_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_columns_columns" DROP CONSTRAINT "guides_blocks_guide_columns_columns_video_file_id_media_id_fk";
  
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP CONSTRAINT "guides_blocks_guide_columns_columns_poster_id_media_id_fk";
  
  ALTER TABLE "guides_blocks_guide_video" DROP CONSTRAINT "guides_blocks_guide_video_video_file_id_media_id_fk";
  
  ALTER TABLE "guides_blocks_guide_video" DROP CONSTRAINT "guides_blocks_guide_video_poster_id_media_id_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP CONSTRAINT "_guides_v_blocks_guide_columns_columns_video_file_id_media_id_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP CONSTRAINT "_guides_v_blocks_guide_columns_columns_poster_id_media_id_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_video" DROP CONSTRAINT "_guides_v_blocks_guide_video_video_file_id_media_id_fk";
  
  ALTER TABLE "_guides_v_blocks_guide_video" DROP CONSTRAINT "_guides_v_blocks_guide_video_poster_id_media_id_fk";
  
  DROP INDEX "guides_blocks_guide_columns_columns_video_file_idx";
  DROP INDEX "guides_blocks_guide_columns_columns_poster_idx";
  DROP INDEX "guides_blocks_guide_video_video_file_idx";
  DROP INDEX "guides_blocks_guide_video_poster_idx";
  DROP INDEX "_guides_v_blocks_guide_columns_columns_video_file_idx";
  DROP INDEX "_guides_v_blocks_guide_columns_columns_poster_idx";
  DROP INDEX "_guides_v_blocks_guide_video_video_file_idx";
  DROP INDEX "_guides_v_blocks_guide_video_poster_idx";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "video_file_id";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "poster_id";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "autoplay";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "muted";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "loop";
  ALTER TABLE "guides_blocks_guide_columns_columns" DROP COLUMN "show_controls";
  ALTER TABLE "guides_blocks_guide_columns" DROP COLUMN "width";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "source";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "video_file_id";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "poster_id";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "autoplay";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "muted";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "loop";
  ALTER TABLE "guides_blocks_guide_video" DROP COLUMN "show_controls";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "video_file_id";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "poster_id";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "autoplay";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "muted";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "loop";
  ALTER TABLE "_guides_v_blocks_guide_columns_columns" DROP COLUMN "show_controls";
  ALTER TABLE "_guides_v_blocks_guide_columns" DROP COLUMN "width";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "source";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "video_file_id";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "poster_id";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "autoplay";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "muted";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "loop";
  ALTER TABLE "_guides_v_blocks_guide_video" DROP COLUMN "show_controls";
  ALTER TABLE "public"."guides_blocks_guide_columns_columns" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_guides_blocks_guide_columns_columns_type";
  CREATE TYPE "public"."enum_guides_blocks_guide_columns_columns_type" AS ENUM('text', 'image');
  ALTER TABLE "public"."guides_blocks_guide_columns_columns" ALTER COLUMN "type" SET DATA TYPE "public"."enum_guides_blocks_guide_columns_columns_type" USING "type"::"public"."enum_guides_blocks_guide_columns_columns_type";
  ALTER TABLE "public"."_guides_v_blocks_guide_columns_columns" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type";
  CREATE TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type" AS ENUM('text', 'image');
  ALTER TABLE "public"."_guides_v_blocks_guide_columns_columns" ALTER COLUMN "type" SET DATA TYPE "public"."enum__guides_v_blocks_guide_columns_columns_type" USING "type"::"public"."enum__guides_v_blocks_guide_columns_columns_type";
  DROP TYPE "public"."enum_guides_blocks_guide_columns_width";
  DROP TYPE "public"."enum_guides_blocks_guide_video_source";
  DROP TYPE "public"."enum__guides_v_blocks_guide_columns_width";
  DROP TYPE "public"."enum__guides_v_blocks_guide_video_source";`)
}
