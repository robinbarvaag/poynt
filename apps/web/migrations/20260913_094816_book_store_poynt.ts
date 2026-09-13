import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE text;
  UPDATE "public"."book_access" SET "store" = 'poynt' WHERE "store" = 'annet';
  DROP TYPE "public"."enum_book_access_store";
  CREATE TYPE "public"."enum_book_access_store" AS ENUM('ark', 'norli', 'poynt');
  ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE "public"."enum_book_access_store" USING "store"::"public"."enum_book_access_store";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE text;
  UPDATE "public"."book_access" SET "store" = 'annet' WHERE "store" = 'poynt';
  DROP TYPE "public"."enum_book_access_store";
  CREATE TYPE "public"."enum_book_access_store" AS ENUM('ark', 'norli', 'annet');
  ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE "public"."enum_book_access_store" USING "store"::"public"."enum_book_access_store";`)
}
