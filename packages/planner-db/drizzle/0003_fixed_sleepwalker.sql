CREATE TABLE "planner_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_webhook_event_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE INDEX "planner_webhook_event_event_id_idx" ON "planner_webhook_event" USING btree ("event_id");