import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_blocks_product_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"eyebrow" varchar,
  	"text" varchar,
  	"show_add_to_cart" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_product_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"eyebrow" varchar,
  	"text" varchar,
  	"show_add_to_cart" boolean DEFAULT true,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "homepage_blocks_product_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"eyebrow" varchar,
  	"text" varchar,
  	"show_add_to_cart" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_product_spotlight" ADD CONSTRAINT "pages_blocks_product_spotlight_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_product_spotlight" ADD CONSTRAINT "pages_blocks_product_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_product_spotlight" ADD CONSTRAINT "_pages_v_blocks_product_spotlight_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_product_spotlight" ADD CONSTRAINT "_pages_v_blocks_product_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_spotlight" ADD CONSTRAINT "homepage_blocks_product_spotlight_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_blocks_product_spotlight" ADD CONSTRAINT "homepage_blocks_product_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_product_spotlight_order_idx" ON "pages_blocks_product_spotlight" USING btree ("_order");
  CREATE INDEX "pages_blocks_product_spotlight_parent_id_idx" ON "pages_blocks_product_spotlight" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_product_spotlight_path_idx" ON "pages_blocks_product_spotlight" USING btree ("_path");
  CREATE INDEX "pages_blocks_product_spotlight_product_idx" ON "pages_blocks_product_spotlight" USING btree ("product_id");
  CREATE INDEX "_pages_v_blocks_product_spotlight_order_idx" ON "_pages_v_blocks_product_spotlight" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_product_spotlight_parent_id_idx" ON "_pages_v_blocks_product_spotlight" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_product_spotlight_path_idx" ON "_pages_v_blocks_product_spotlight" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_product_spotlight_product_idx" ON "_pages_v_blocks_product_spotlight" USING btree ("product_id");
  CREATE INDEX "homepage_blocks_product_spotlight_order_idx" ON "homepage_blocks_product_spotlight" USING btree ("_order");
  CREATE INDEX "homepage_blocks_product_spotlight_parent_id_idx" ON "homepage_blocks_product_spotlight" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_product_spotlight_path_idx" ON "homepage_blocks_product_spotlight" USING btree ("_path");
  CREATE INDEX "homepage_blocks_product_spotlight_product_idx" ON "homepage_blocks_product_spotlight" USING btree ("product_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_product_spotlight" CASCADE;
  DROP TABLE "_pages_v_blocks_product_spotlight" CASCADE;
  DROP TABLE "homepage_blocks_product_spotlight" CASCADE;`)
}
