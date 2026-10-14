import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_book_access_store" ADD VALUE 'gave';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE text;
  DROP TYPE "public"."enum_book_access_store";
  CREATE TYPE "public"."enum_book_access_store" AS ENUM('ark', 'norli', 'poynt');
  ALTER TABLE "public"."book_access" ALTER COLUMN "store" SET DATA TYPE "public"."enum_book_access_store" USING "store"::"public"."enum_book_access_store";`)
}
