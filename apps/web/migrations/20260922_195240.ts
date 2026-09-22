import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Del 2 av 2 (se 20260922_195239 for hvorfor dette er delt).
 *
 * - `sale_source` får «innkjop» som standard: bokhandlernes innkjøp er det
 *   vanligste manuelle salget å føre.
 * - `replaces_estimate` / `period_start` fjernes. De fantes for å hindre at et
 *   butikk-estimat og en avregning talte de samme bøkene to ganger — men nå
 *   holdes «solgt inn» og «ut av hyllene» adskilt i dashbordet, så
 *   dobbelttellingen kan ikke oppstå og feltene har ingen jobb.
 * - `print_cost_per_copy` fjernes. Boka trykkes i opplag og hele fakturaen
 *   betales opp front, så trykk hører hjemme som en rad i Bokutgifter. Sto den
 *   begge steder ville opplaget blitt betalt to ganger i regnestykket.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_sales" ALTER COLUMN "sale_source" SET DEFAULT 'innkjop';
  ALTER TABLE "book_sales" DROP COLUMN "replaces_estimate";
  ALTER TABLE "book_sales" DROP COLUMN "period_start";
  ALTER TABLE "book_economy" DROP COLUMN "print_cost_per_copy";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "book_sales" ALTER COLUMN "sale_source" SET DEFAULT 'avregning';
  ALTER TABLE "book_sales" ADD COLUMN "replaces_estimate" boolean DEFAULT false;
  ALTER TABLE "book_sales" ADD COLUMN "period_start" timestamp(3) with time zone;
  ALTER TABLE "book_economy" ADD COLUMN "print_cost_per_copy" numeric DEFAULT 0;`)
}
