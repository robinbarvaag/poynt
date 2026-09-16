import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "universe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"header_label" varchar DEFAULT 'Verdifull vekst',
  	"header_show_exit" boolean DEFAULT true,
  	"header_exit_label" varchar DEFAULT 'Til poynt.no',
  	"outro_enabled" boolean DEFAULT true,
  	"outro_eyebrow" varchar DEFAULT 'Del av Poynt',
  	"outro_title" varchar DEFAULT 'Universet er laget av Poynt',
  	"outro_intro" varchar DEFAULT 'Vi hjelper små bedrifter med endring, salg og markedsføring — i praksis, ikke i teorien.',
  	"outro_primary_cta_text" varchar DEFAULT 'Se hva vi driver med',
  	"outro_primary_cta_url" varchar DEFAULT '/',
  	"outro_secondary_cta_text" varchar DEFAULT 'Ta kontakt',
  	"outro_secondary_cta_url" varchar DEFAULT '/kontakt',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "universe" CASCADE;`)
}
