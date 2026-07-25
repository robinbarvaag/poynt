import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "on_poynt_features" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kanalveileder" boolean DEFAULT true,
  	"markedsplan" boolean DEFAULT true,
  	"arshjul" boolean DEFAULT true,
  	"si_nei_med_stil" boolean DEFAULT true,
  	"svar_pa_henvendelser" boolean DEFAULT true,
  	"podcast_til_innhold" boolean DEFAULT true,
  	"fellesskap" boolean DEFAULT true,
  	"laering" boolean DEFAULT true,
  	"min_bedrift" boolean DEFAULT true,
  	"min_strategi" boolean DEFAULT true,
  	"tilbakemelding" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "on_poynt_features" CASCADE;`)
}
