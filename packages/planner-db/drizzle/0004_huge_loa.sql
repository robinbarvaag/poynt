CREATE TABLE "planner"."planner_task" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"category" text,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_task" ADD CONSTRAINT "planner_task_workspace_id_planner_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "planner"."planner_workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_task_workspace_idx" ON "planner"."planner_task" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "planner_task_done_idx" ON "planner"."planner_task" USING btree ("done");--> statement-breakpoint
CREATE INDEX "planner_task_source_idx" ON "planner"."planner_task" USING btree ("source");