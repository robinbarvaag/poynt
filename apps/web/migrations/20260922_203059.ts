import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_book_stores_follow_up_status" AS ENUM('ingen', 'kontaktet', 'ja', 'nei', 'purr');
  CREATE TYPE "public"."enum_book_stores_source_key" AS ENUM('norli', 'ark');
  CREATE TABLE "book_stores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"follow_up_status" "enum_book_stores_follow_up_status" DEFAULT 'ingen',
  	"follow_up_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"name" varchar NOT NULL,
  	"source_key" "enum_book_stores_source_key" NOT NULL,
  	"city" varchar,
  	"region" varchar,
  	"email" varchar,
  	"phone" varchar,
  	"address" varchar,
  	"postcode" varchar,
  	"schedule" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"current_qty" numeric DEFAULT 0,
  	"max_qty" numeric DEFAULT 0,
  	"sold_estimate" numeric DEFAULT 0,
  	"restocked_estimate" numeric DEFAULT 0,
  	"first_stocked_at" timestamp(3) with time zone,
  	"last_seen_at" timestamp(3) with time zone,
  	"store_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_stores_id" integer;
  CREATE INDEX "book_stores_source_key_idx" ON "book_stores" USING btree ("source_key");
  CREATE INDEX "book_stores_region_idx" ON "book_stores" USING btree ("region");
  CREATE INDEX "book_stores_store_id_idx" ON "book_stores" USING btree ("store_id");
  CREATE INDEX "book_stores_updated_at_idx" ON "book_stores" USING btree ("updated_at");
  CREATE INDEX "book_stores_created_at_idx" ON "book_stores" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_stores_fk" FOREIGN KEY ("book_stores_id") REFERENCES "public"."book_stores"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_book_stores_id_idx" ON "payload_locked_documents_rels" USING btree ("book_stores_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_stores" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "book_stores" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_stores_fk";
  
  DROP INDEX "payload_locked_documents_rels_book_stores_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_stores_id";
  DROP TYPE "public"."enum_book_stores_follow_up_status";
  DROP TYPE "public"."enum_book_stores_source_key";`)
}
