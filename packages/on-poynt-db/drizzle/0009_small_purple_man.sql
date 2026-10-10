CREATE TABLE "planner"."planner_content_view" (
	"id" text PRIMARY KEY NOT NULL,
	"collection" text NOT NULL,
	"content_id" text NOT NULL,
	"slug" text,
	"day" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "content_view_unique" ON "planner"."planner_content_view" USING btree ("collection","content_id","day");