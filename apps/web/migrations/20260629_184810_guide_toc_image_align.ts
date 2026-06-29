import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_guides_blocks_guide_image_align" AS ENUM('center', 'left', 'right');
  CREATE TYPE "public"."enum__guides_v_blocks_guide_image_align" AS ENUM('center', 'left', 'right');
  ALTER TABLE "guides_blocks_guide_image" ADD COLUMN "align" "enum_guides_blocks_guide_image_align" DEFAULT 'center';
  ALTER TABLE "guides" ADD COLUMN "show_toc" boolean DEFAULT true;
  ALTER TABLE "_guides_v_blocks_guide_image" ADD COLUMN "align" "enum__guides_v_blocks_guide_image_align" DEFAULT 'center';
  ALTER TABLE "_guides_v" ADD COLUMN "version_show_toc" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "guides_blocks_guide_image" DROP COLUMN "align";
  ALTER TABLE "guides" DROP COLUMN "show_toc";
  ALTER TABLE "_guides_v_blocks_guide_image" DROP COLUMN "align";
  ALTER TABLE "_guides_v" DROP COLUMN "version_show_toc";
  DROP TYPE "public"."enum_guides_blocks_guide_image_align";
  DROP TYPE "public"."enum__guides_v_blocks_guide_image_align";`)
}
