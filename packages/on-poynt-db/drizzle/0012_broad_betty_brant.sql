CREATE TABLE "planner"."planner_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"category" text DEFAULT 'other' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"admin_response" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_feedback" ADD CONSTRAINT "planner_feedback_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_feedback" ADD CONSTRAINT "planner_feedback_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "planner"."planner_workspace"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_feedback_user_idx" ON "planner"."planner_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "planner_feedback_status_idx" ON "planner"."planner_feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "planner_feedback_created_idx" ON "planner"."planner_feedback" USING btree ("created_at");