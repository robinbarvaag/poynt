ALTER TABLE "planner_user" ADD COLUMN "canonical_email" text NOT NULL;--> statement-breakpoint
CREATE INDEX "planner_user_canonical_email_idx" ON "planner_user" USING btree ("canonical_email");