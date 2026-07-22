import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_og_style" AS ENUM('overlay', 'panel');
  ALTER TABLE "site_settings" ADD COLUMN "og_logo_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "og_cta_text" varchar DEFAULT 'Les mer på poynt.no';
  ALTER TABLE "site_settings" ADD COLUMN "og_style" "enum_site_settings_og_style" DEFAULT 'overlay';
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_logo_id_media_id_fk" FOREIGN KEY ("og_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "site_settings_og_logo_idx" ON "site_settings" USING btree ("og_logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_og_logo_id_media_id_fk";
  
  DROP INDEX "site_settings_og_logo_idx";
  ALTER TABLE "site_settings" DROP COLUMN "og_logo_id";
  ALTER TABLE "site_settings" DROP COLUMN "og_cta_text";
  ALTER TABLE "site_settings" DROP COLUMN "og_style";
  DROP TYPE "public"."enum_site_settings_og_style";`)
}
