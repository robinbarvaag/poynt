CREATE TABLE "planner"."planner_message_reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_message_reaction" ADD CONSTRAINT "planner_message_reaction_message_id_planner_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "planner"."planner_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planner"."planner_message_reaction" ADD CONSTRAINT "planner_message_reaction_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "planner_message_reaction_unique_idx" ON "planner"."planner_message_reaction" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "planner_message_reaction_message_idx" ON "planner"."planner_message_reaction" USING btree ("message_id");