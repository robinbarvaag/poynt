import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_book_access_store" AS ENUM('ark', 'norli', 'annet');
  CREATE TABLE "book_access" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar NOT NULL,
  	"store" "enum_book_access_store" NOT NULL,
  	"page_id" integer,
  	"email" varchar,
  	"newsletter_opt_in" boolean DEFAULT false,
  	"uses" numeric DEFAULT 1,
  	"last_used_at" timestamp(3) with time zone,
  	"blocked" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "pages" ADD COLUMN "book_gate" boolean DEFAULT false;
  ALTER TABLE "_pages_v" ADD COLUMN "version_book_gate" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "book_access_id" integer;
  ALTER TABLE "book_access" ADD CONSTRAINT "book_access_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "book_access_order_number_idx" ON "book_access" USING btree ("order_number");
  CREATE INDEX "book_access_page_idx" ON "book_access" USING btree ("page_id");
  CREATE INDEX "book_access_updated_at_idx" ON "book_access" USING btree ("updated_at");
  CREATE INDEX "book_access_created_at_idx" ON "book_access" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_book_access_fk" FOREIGN KEY ("book_access_id") REFERENCES "public"."book_access"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_book_access_id_idx" ON "payload_locked_documents_rels" USING btree ("book_access_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_access" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "book_access" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_book_access_fk";
  
  DROP INDEX "payload_locked_documents_rels_book_access_id_idx";
  ALTER TABLE "pages" DROP COLUMN "book_gate";
  ALTER TABLE "_pages_v" DROP COLUMN "version_book_gate";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "book_access_id";
  DROP TYPE "public"."enum_book_access_store";`)
}
