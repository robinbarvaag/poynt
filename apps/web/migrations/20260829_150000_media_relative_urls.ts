import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Datafix: Blob-pluginen lagrer `url`/`thumbnailURL`/`sizes.*.url` som absolutte
// adresser med den `serverURL`-en som gjaldt ved opplasting. Bilder lastet opp
// lokalt fikk dermed `http://localhost:3000/...` i databasen, og admin-panelet
// på Vercel (som bruker den lagrede verdien direkte) viste ødelagte miniatyrer.
// Frontend var upåvirket fordi `toRelativeMediaUrl` stripper verten.
// Vi gjør alle app-serverte media-stier host-relative — de virker på alle domener.
const columns = [
  'url',
  'thumbnail_u_r_l',
  'sizes_thumbnail_url',
  'sizes_card_url',
  'sizes_tablet_url',
  'sizes_og_url',
] as const

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const column of columns) {
    await db.execute(sql`
      UPDATE "media"
      SET ${sql.identifier(column)} = regexp_replace(${sql.identifier(column)}, '^https?://[^/]+', '')
      WHERE ${sql.identifier(column)} ~ '^https?://[^/]+/api/media/';`)
  }
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Irreversibel datafix (opprinnelig vert er ukjent). Relative stier fungerer
  // uansett, så ingenting å rulle tilbake.
}
