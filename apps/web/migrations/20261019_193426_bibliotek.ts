import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_sales_channel" ADD VALUE 'bibliotek' BEFORE 'annet';
  ALTER TYPE "public"."enum_book_economy_channels_key" ADD VALUE 'bibliotek' BEFORE 'annet';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_sales" ALTER COLUMN "channel" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_sales_channel";
  CREATE TYPE "public"."enum_book_sales_channel" AS ENUM('norli', 'ark', 'egen', 'foredrag', 'direkte', 'annet');
  ALTER TABLE "public"."book_sales" ALTER COLUMN "channel" SET DATA TYPE "public"."enum_book_sales_channel" USING "channel"::"public"."enum_book_sales_channel";
  ALTER TABLE "public"."book_economy_channels" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_economy_channels_key";
  CREATE TYPE "public"."enum_book_economy_channels_key" AS ENUM('norli', 'ark', 'egen', 'foredrag', 'direkte', 'annet');
  ALTER TABLE "public"."book_economy_channels" ALTER COLUMN "key" SET DATA TYPE "public"."enum_book_economy_channels_key" USING "key"::"public"."enum_book_economy_channels_key";`)
}
