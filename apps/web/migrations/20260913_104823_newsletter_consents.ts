import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_newsletter_consents_source" AS ENUM('newsletter-form', 'book-access', 'checkout', 'receipt', 'membership', 'waitlist');
  CREATE TABLE "newsletter_consents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"source" "enum_newsletter_consents_source" NOT NULL,
  	"consent_text" varchar NOT NULL,
  	"path" varchar,
  	"reference" varchar,
  	"subscribed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_consents_id" integer;
  CREATE INDEX "newsletter_consents_email_idx" ON "newsletter_consents" USING btree ("email");
  CREATE INDEX "newsletter_consents_updated_at_idx" ON "newsletter_consents" USING btree ("updated_at");
  CREATE INDEX "newsletter_consents_created_at_idx" ON "newsletter_consents" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_consents_fk" FOREIGN KEY ("newsletter_consents_id") REFERENCES "public"."newsletter_consents"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_newsletter_consents_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_consents_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "newsletter_consents" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "newsletter_consents" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_consents_fk";
  
  DROP INDEX "payload_locked_documents_rels_newsletter_consents_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_consents_id";
  DROP TYPE "public"."enum_newsletter_consents_source";`)
}
