CREATE TABLE "planner"."planner_content_suggestion" (
	"id" text PRIMARY KEY NOT NULL,
	"dedup_key" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"rationale" text NOT NULL,
	"target_collection" text,
	"target_id" text,
	"category" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"evidence" jsonb,
	"source" text DEFAULT 'radar' NOT NULL,
	"run_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_content_suggestion_dedup_key_unique" UNIQUE("dedup_key")
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_inspiration_item" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"summary" text,
	"topics" jsonb,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_inspiration_source" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'website' NOT NULL,
	"person_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"cadence" text DEFAULT 'weekly' NOT NULL,
	"last_fetched_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planner"."planner_radar_run" (
	"id" text PRIMARY KEY NOT NULL,
	"trigger" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp,
	"stats" jsonb,
	"error" text
);
