import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "checkout_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"success_eyebrow" varchar DEFAULT 'Bekreftet',
  	"success_title" varchar DEFAULT 'Takk for kjøpet!',
  	"success_text" varchar DEFAULT 'Ordren din er bekreftet, og en ordrebekreftelse er på vei til innboksen din. Kjøpte du en PDF, ligger den vedlagt e-posten – klar til å lastes ned.',
  	"success_primary_cta_label" varchar DEFAULT 'Se flere produkter',
  	"success_primary_cta_url" varchar DEFAULT '/produkter',
  	"success_secondary_cta_label" varchar DEFAULT 'Til forsiden',
  	"success_secondary_cta_url" varchar DEFAULT '/',
  	"cancelled_eyebrow" varchar DEFAULT 'Ikke fullført',
  	"cancelled_title" varchar DEFAULT 'Betalingen ble avbrutt',
  	"cancelled_text" varchar DEFAULT 'Ingen penger er trukket, og handlekurven din er urørt. Du kan prøve igjen når du vil – eller ta kontakt hvis noe ikke fungerte som det skulle.',
  	"cancelled_primary_cta_label" varchar DEFAULT 'Tilbake til handlekurven',
  	"cancelled_primary_cta_url" varchar DEFAULT '/handlekurv',
  	"cancelled_secondary_cta_label" varchar DEFAULT 'Kontakt oss',
  	"cancelled_secondary_cta_url" varchar DEFAULT '/kontakt',
  	"email_subject" varchar DEFAULT 'Ordrebekreftelse',
  	"email_heading" varchar DEFAULT 'Takk for bestillingen!',
  	"email_intro" varchar DEFAULT 'Vi har mottatt bestillingen din. Her er en oppsummering av kjøpet.',
  	"email_pdf_note" varchar DEFAULT 'PDF-ene du har kjøpt ligger vedlagt denne e-posten – last dem ned og kos deg!',
  	"email_footer" varchar DEFAULT 'Har du spørsmål om bestillingen, er det bare å svare på denne e-posten.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ADD COLUMN "pdf_file_id" integer;
  ALTER TABLE "products" ADD CONSTRAINT "products_pdf_file_id_media_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "products_pdf_file_idx" ON "products" USING btree ("pdf_file_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "checkout_settings" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_pdf_file_id_media_id_fk";
  
  DROP INDEX "products_pdf_file_idx";
  ALTER TABLE "products" DROP COLUMN "pdf_file_id";`)
}
