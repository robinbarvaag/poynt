import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "courses_modules_lessons_steps_substeps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "courses_modules_lessons_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"body" jsonb
  );
  
  CREATE TABLE "_courses_v_version_modules_lessons_steps_substeps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_courses_v_version_modules_lessons_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"body" jsonb,
  	"_uuid" varchar
  );
  
  ALTER TABLE "courses_modules_lessons_steps_substeps" ADD CONSTRAINT "courses_modules_lessons_steps_substeps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_modules_lessons_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_modules_lessons_steps" ADD CONSTRAINT "courses_modules_lessons_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_modules_lessons_steps" ADD CONSTRAINT "courses_modules_lessons_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."courses_modules_lessons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons_steps_substeps" ADD CONSTRAINT "_courses_v_version_modules_lessons_steps_substeps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_modules_lessons_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons_steps" ADD CONSTRAINT "_courses_v_version_modules_lessons_steps_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_courses_v_version_modules_lessons_steps" ADD CONSTRAINT "_courses_v_version_modules_lessons_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_courses_v_version_modules_lessons"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_modules_lessons_steps_substeps_order_idx" ON "courses_modules_lessons_steps_substeps" USING btree ("_order");
  CREATE INDEX "courses_modules_lessons_steps_substeps_parent_id_idx" ON "courses_modules_lessons_steps_substeps" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_lessons_steps_order_idx" ON "courses_modules_lessons_steps" USING btree ("_order");
  CREATE INDEX "courses_modules_lessons_steps_parent_id_idx" ON "courses_modules_lessons_steps" USING btree ("_parent_id");
  CREATE INDEX "courses_modules_lessons_steps_image_idx" ON "courses_modules_lessons_steps" USING btree ("image_id");
  CREATE INDEX "_courses_v_version_modules_lessons_steps_substeps_order_idx" ON "_courses_v_version_modules_lessons_steps_substeps" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_lessons_steps_substeps_parent_id_idx" ON "_courses_v_version_modules_lessons_steps_substeps" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_lessons_steps_order_idx" ON "_courses_v_version_modules_lessons_steps" USING btree ("_order");
  CREATE INDEX "_courses_v_version_modules_lessons_steps_parent_id_idx" ON "_courses_v_version_modules_lessons_steps" USING btree ("_parent_id");
  CREATE INDEX "_courses_v_version_modules_lessons_steps_image_idx" ON "_courses_v_version_modules_lessons_steps" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "courses_modules_lessons_steps_substeps" CASCADE;
  DROP TABLE "courses_modules_lessons_steps" CASCADE;
  DROP TABLE "_courses_v_version_modules_lessons_steps_substeps" CASCADE;
  DROP TABLE "_courses_v_version_modules_lessons_steps" CASCADE;`)
}
