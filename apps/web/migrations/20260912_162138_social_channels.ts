import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_site_settings_social_links_platform" ADD VALUE 'threads';
  ALTER TYPE "public"."enum_site_settings_social_links_platform" ADD VALUE 'pinterest';
  ALTER TYPE "public"."enum_site_settings_social_links_platform" ADD VALUE 'snapchat';
  ALTER TABLE "site_settings" ADD COLUMN "show_social_fab" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "show_social_fab";
  ALTER TABLE "public"."site_settings_social_links" ALTER COLUMN "platform" SET DATA TYPE text;
  DROP TYPE "public"."enum_site_settings_social_links_platform";
  CREATE TYPE "public"."enum_site_settings_social_links_platform" AS ENUM('facebook', 'instagram', 'linkedin', 'twitter', 'youtube', 'tiktok');
  ALTER TABLE "public"."site_settings_social_links" ALTER COLUMN "platform" SET DATA TYPE "public"."enum_site_settings_social_links_platform" USING "platform"::"public"."enum_site_settings_social_links_platform";`)
}
