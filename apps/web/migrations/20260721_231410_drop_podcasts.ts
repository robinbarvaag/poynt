import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "podcasts_guests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcasts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "podcasts_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "podcasts_guests" CASCADE;
  DROP TABLE "podcasts" CASCADE;
  DROP TABLE "podcasts_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_podcasts_fk";

  DROP INDEX IF EXISTS "payload_locked_documents_rels_podcasts_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "podcasts_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "podcasts_guests" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "podcasts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"content" jsonb,
  	"spotify_url" varchar NOT NULL,
  	"cover_image_id" integer,
  	"duration" varchar,
  	"episode_number" numeric,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "podcasts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "podcasts_id" integer;
  ALTER TABLE "podcasts_guests" ADD CONSTRAINT "podcasts_guests_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcasts" ADD CONSTRAINT "podcasts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "podcasts_rels" ADD CONSTRAINT "podcasts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "podcasts_rels" ADD CONSTRAINT "podcasts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "podcasts_guests_order_idx" ON "podcasts_guests" USING btree ("_order");
  CREATE INDEX "podcasts_guests_parent_id_idx" ON "podcasts_guests" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "podcasts_slug_idx" ON "podcasts" USING btree ("slug");
  CREATE INDEX "podcasts_cover_image_idx" ON "podcasts" USING btree ("cover_image_id");
  CREATE INDEX "podcasts_updated_at_idx" ON "podcasts" USING btree ("updated_at");
  CREATE INDEX "podcasts_created_at_idx" ON "podcasts" USING btree ("created_at");
  CREATE INDEX "podcasts_rels_order_idx" ON "podcasts_rels" USING btree ("order");
  CREATE INDEX "podcasts_rels_parent_idx" ON "podcasts_rels" USING btree ("parent_id");
  CREATE INDEX "podcasts_rels_path_idx" ON "podcasts_rels" USING btree ("path");
  CREATE INDEX "podcasts_rels_categories_id_idx" ON "podcasts_rels" USING btree ("categories_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_podcasts_fk" FOREIGN KEY ("podcasts_id") REFERENCES "public"."podcasts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_podcasts_id_idx" ON "payload_locked_documents_rels" USING btree ("podcasts_id");`)
}
