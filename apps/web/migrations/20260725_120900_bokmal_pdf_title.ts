import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Datafix: produkter som fikk den gamle nynorsk-defaulten som lagret verdi.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "products" SET "pdf_preview_title" = 'Ta en titt inni' WHERE "pdf_preview_title" = 'Ta ein titt inni';`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "products" SET "pdf_preview_title" = 'Ta ein titt inni' WHERE "pdf_preview_title" = 'Ta en titt inni';`)
}
