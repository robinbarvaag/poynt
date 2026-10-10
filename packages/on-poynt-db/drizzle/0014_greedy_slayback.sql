CREATE TYPE "planner"."planner_notification_type" AS ENUM('mention', 'dm');--> statement-breakpoint
CREATE TABLE "planner"."planner_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "planner"."planner_notification_type" NOT NULL,
	"actor_id" text,
	"conversation_id" text,
	"message_id" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_notification" ADD CONSTRAINT "planner_notification_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_notification" ADD CONSTRAINT "planner_notification_actor_id_planner_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "planner"."planner_user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_notification" ADD CONSTRAINT "planner_notification_conversation_id_planner_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "planner"."planner_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_notification" ADD CONSTRAINT "planner_notification_message_id_planner_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "planner"."planner_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_notification_user_idx" ON "planner"."planner_notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "planner_notification_user_read_idx" ON "planner"."planner_notification" USING btree ("user_id","read_at");