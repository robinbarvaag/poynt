import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_book_hero_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_book_hero_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "homepage_blocks_book_hero_chapters" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"text" varchar
  );
  
  ALTER TABLE "pages_blocks_book_hero_chapters" ADD CONSTRAINT "pages_blocks_book_hero_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_book_hero_chapters" ADD CONSTRAINT "_pages_v_blocks_book_hero_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_book_hero_chapters" ADD CONSTRAINT "homepage_blocks_book_hero_chapters_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage_blocks_book_hero"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_book_hero_chapters_order_idx" ON "pages_blocks_book_hero_chapters" USING btree ("_order");
  CREATE INDEX "pages_blocks_book_hero_chapters_parent_id_idx" ON "pages_blocks_book_hero_chapters" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_book_hero_chapters_order_idx" ON "_pages_v_blocks_book_hero_chapters" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_book_hero_chapters_parent_id_idx" ON "_pages_v_blocks_book_hero_chapters" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_book_hero_chapters_order_idx" ON "homepage_blocks_book_hero_chapters" USING btree ("_order");
  CREATE INDEX "homepage_blocks_book_hero_chapters_parent_id_idx" ON "homepage_blocks_book_hero_chapters" USING btree ("_parent_id");
  ALTER TABLE "pages_blocks_book_hero" DROP COLUMN "show_signup_count";
  ALTER TABLE "_pages_v_blocks_book_hero" DROP COLUMN "show_signup_count";
  ALTER TABLE "homepage_blocks_book_hero" DROP COLUMN "show_signup_count";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_book_hero_chapters" CASCADE;
  DROP TABLE "_pages_v_blocks_book_hero_chapters" CASCADE;
  DROP TABLE "homepage_blocks_book_hero_chapters" CASCADE;
  ALTER TABLE "pages_blocks_book_hero" ADD COLUMN "show_signup_count" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_book_hero" ADD COLUMN "show_signup_count" boolean DEFAULT true;
  ALTER TABLE "homepage_blocks_book_hero" ADD COLUMN "show_signup_count" boolean DEFAULT true;`)
}
