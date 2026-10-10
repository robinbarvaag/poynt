CREATE TABLE "planner"."planner_push_subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planner_push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "planner"."planner_push_subscription" ADD CONSTRAINT "planner_push_subscription_user_id_planner_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "planner"."planner_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "planner_push_subscription_user_idx" ON "planner"."planner_push_subscription" USING btree ("user_id");