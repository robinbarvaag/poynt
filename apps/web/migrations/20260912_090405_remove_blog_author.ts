import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_author_id_users_id_fk";
  
  ALTER TABLE "_blog_posts_v" DROP CONSTRAINT "_blog_posts_v_version_author_id_users_id_fk";
  
  DROP INDEX "blog_posts_author_idx";
  DROP INDEX "_blog_posts_v_version_version_author_idx";
  ALTER TABLE "blog_posts" DROP COLUMN "author_id";
  ALTER TABLE "_blog_posts_v" DROP COLUMN "version_author_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "blog_posts" ADD COLUMN "author_id" integer;
  ALTER TABLE "_blog_posts_v" ADD COLUMN "version_author_id" integer;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "blog_posts_author_idx" ON "blog_posts" USING btree ("author_id");
  CREATE INDEX "_blog_posts_v_version_version_author_idx" ON "_blog_posts_v" USING btree ("version_author_id");`)
}
