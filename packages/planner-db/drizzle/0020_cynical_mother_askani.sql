CREATE TABLE "planner"."planner_course_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_slug" text NOT NULL,
	"lesson_key" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_course_progress" ADD CONSTRAINT "planner_course_progress_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "planner_course_progress_unique_idx" ON "planner"."planner_course_progress" USING btree ("user_id","course_slug","lesson_key");--> statement-breakpoint
CREATE INDEX "planner_course_progress_user_course_idx" ON "planner"."planner_course_progress" USING btree ("user_id","course_slug");